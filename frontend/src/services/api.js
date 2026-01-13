// Render for OAuth, local for heavy processing
const RENDER_URL = "https://gmail-login-backend.onrender.com";
const LOCAL_URL = "http://localhost:5001";

/**
 * Check if the backend is authenticated with Gmail
 */
export async function checkAuthStatus() {
  try {
    const response = await fetch(`${RENDER_URL}/status`);
    const data = await response.json();
    return data.authenticated;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
}

/**
 * Get authenticated user's Gmail profile info
 */
export async function getUserInfo() {
  try {
    const response = await fetch(`${RENDER_URL}/user-info`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

/**
 * Log out and clear authentication
 */
export async function logout() {
  try {
    const response = await fetch(`${RENDER_URL}/logout`);
    const data = await response.json();
    if (data.success) {
      localStorage.removeItem("gmail_connected");
    }
    return data.success;
  } catch (error) {
    console.error("Error logging out:", error);
    return false;
  }
}

/**
 * Process emails with real-time progress updates via SSE
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format (optional)
 * @param refresh - Bypass cache and fetch fresh data
 * @param onProgress - Callback for progress updates
 * @returns Promise that resolves with the final ProcessResponse
 */
export function processApplicationsWithProgress(
  startDate,
  endDate,
  refresh,
  onProgress
) {
  return new Promise((resolve, reject) => {
    // Build URL with date parameters
    let url = `${LOCAL_URL}/process-stream`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (refresh) params.append("refresh", "true");
    if (params.toString()) url += `?${params.toString()}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Call progress callback for all events
        if (onProgress) {
          onProgress(data);
        }

        // Handle completion
        if (data.type === "done" || data.type === "cached") {
          eventSource.close();
          const result = data.data;
          if (result?.error) {
            reject(new Error(result.error));
          } else {
            resolve(result || { companies: [], total_companies: 0, total_applications: 0 });
          }
        }
      } catch (e) {
        console.error("Error parsing SSE event:", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
      reject(new Error("Connection to server lost"));
    };
  });
}

/**
 * Process emails and return application data
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format (optional)
 * @param refresh - Bypass cache and fetch fresh data
 */
export async function processApplications(startDate, endDate, refresh) {
  try {
    // Build URL with date parameters
    let url = `${LOCAL_URL}/process`;
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (refresh) params.append("refresh", "true");
    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process applications");
    }

    return await response.json();
  } catch (error) {
    console.error("Error processing applications:", error);
    throw error;
  }
}

/**
 * Transform backend data to dashboard format
 */
export function transformToApplications(data) {
  const applications = [];

  let id = 1;
  for (const company of data.companies) {
    for (let posIndex = 0; posIndex < company.positions.length; posIndex++) {
      const pos = company.positions[posIndex];
      // Determine status and stage
      let status = "Applied";
      let stage = "Application Submitted";

      if (pos.app_accepted === "y") {
        status = "Offer";
        stage = "Offer Received";
      } else if (pos.app_accepted === "n") {
        status = "Rejection";
        stage = "Application Rejected";
      } else if (parseInt(pos.num_human_interview) > 0) {
        status = "Interview";
        stage = `Interview Round ${pos.num_human_interview}`;
      } else if (pos.coding_test) {
        status = "Coding Test";
        stage = "Technical Assessment";
      } else if (pos.video_interview) {
        status = "Video Interview";
        stage = "Video Interview";
      } else if (pos.aptitude_test || pos.simulation_test) {
        status = "Assessment";
        stage = "Online Assessment";
      }

      // Find last update date
      const dates = [
        pos.application_submitted,
        pos.aptitude_test,
        pos.simulation_test,
        pos.coding_test,
        pos.video_interview,
      ].filter(Boolean);

      const lastUpdate = dates.length > 0
        ? dates.sort().reverse()[0]
        : pos.application_submitted || "";

      applications.push({
        id: id++,
        company: company.name,
        position: pos.position || "Unknown Position",
        status,
        appliedDate: pos.application_submitted || "",
        lastUpdate,
        stage,
        emails: company.email_count,
        tests: {
          aptitude: pos.aptitude_test,
          simulation: pos.simulation_test,
          coding: pos.coding_test,
          video: pos.video_interview,
        },
        interviews: parseInt(pos.num_human_interview) || 0,
        manual: pos.manual || false,
        positionIndex: posIndex,
        companyManual: company.manual || false,
      });
    }
  }

  return applications;
}

/**
 * Calculate stats from applications
 */
export function calculateStats(applications) {
  const total = applications.length;
  const pending = applications.filter(a => !["Rejection", "Offer"].includes(a.status)).length;
  const interviews = applications.filter(a => a.status === "Interview").length;
  const offers = applications.filter(a => a.status === "Offer").length;
  const rejections = applications.filter(a => a.status === "Rejection").length;

  return {
    total,
    pending,
    interviews,
    offers,
    rejections,
    responseRate: total > 0 ? Math.round(((interviews + offers + rejections) / total) * 100) : 0,
  };
}

/**
 * Add a new application manually
 */
export async function addApplication(
  company,
  position
) {
  try {
    const response = await fetch(`${LOCAL_URL}/applications/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, position }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to add application");
    }
    return data;
  } catch (error) {
    console.error("Error adding application:", error);
    return { error: error instanceof Error ? error.message : "Failed to add application" };
  }
}

/**
 * Update an existing application
 */
export async function updateApplication(
  company,
  positionIndex,
  position,
  newCompanyName
) {
  try {
    const body = {
      company,
      position_index: positionIndex,
      position,
    };
    if (newCompanyName) {
      body.new_company_name = newCompanyName;
    }

    const response = await fetch(`${LOCAL_URL}/applications/update`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update application");
    }
    return data;
  } catch (error) {
    console.error("Error updating application:", error);
    return { error: error instanceof Error ? error.message : "Failed to update application" };
  }
}

/**
 * Delete an application (position or entire company)
 */
export async function deleteApplication(
  company,
  positionIndex
) {
  try {
    const body = { company };
    if (positionIndex !== undefined) {
      body.position_index = positionIndex;
    }

    const response = await fetch(`${LOCAL_URL}/applications/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete application");
    }
    return data;
  } catch (error) {
    console.error("Error deleting application:", error);
    return { error: error instanceof Error ? error.message : "Failed to delete application" };
  }
}

/**
 * Get all applications from cache
 */
export async function getApplications() {
  try {
    const response = await fetch(`${LOCAL_URL}/applications`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to get applications");
    }
    return data;
  } catch (error) {
    console.error("Error getting applications:", error);
    return { companies: [], total_companies: 0, total_applications: 0, error: error instanceof Error ? error.message : "Failed to get applications" };
  }
}

/**
 * Send a message to the AI chatbot
 * @param message - User's message
 * @param applications - Current application data for context
 */
export async function sendChatMessage(
  message,
  applications
) {
  try {
    const response = await fetch(`${LOCAL_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        applications,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get response from assistant");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    return { error: error instanceof Error ? error.message : "Failed to connect to assistant" };
  }
}
