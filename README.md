# JobTracker AI

An agentic AI-powered job application tracker that automatically extracts, classifies, and visualizes your job applications from Gmail using a parallel-sequential processing pipeline.

🌐 **Live Demo:** [youraijobtracker.vercel.app](https://youraijobtracker.vercel.app)

## The Problem

![Job Application Process](frontend/public/main_page_img3.png)

Existing platforms like LinkedIn and Glassdoor help you discover job opportunities, but no solution automatically tracks your application progress across different companies and stages.

## Features

- **Gmail Integration** — One-click OAuth connection to scan your inbox
- **Agentic AI Pipeline** — Sequential and parallel GPT-4o-mini agents classify companies, positions, and stages
- **Visual Dashboard** — Track applications with funnel, Sankey diagram, and timeline views
- **Stage Tracking** — Monitor progress through aptitude tests, coding tests, video interviews, and offers
- **Real-time Processing** — Live progress updates as emails are analyzed
- **CV Analysis** — Upload your CV and get AI-powered feedback based on your application history
- **Job Recommendations** — Personalized job search powered by Adzuna API
- **Bottleneck Insights** — Detects where you're stalling in the pipeline with targeted HKU CEDARS resources
- **Manual Entries** — Add and edit applications that weren't detected automatically
- **LinkedIn Share** — Share your job search stats directly to LinkedIn

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Frontend Hosting | Vercel |
| AI Processing Server | Python, Flask (local via Cloudflare Tunnel) |
| Auth Server | Python, Flask (AWS EC2 + nginx) |
| AI | OpenAI API (GPT-4o-mini) |
| Auth | Google OAuth 2.0 PKCE |
| APIs | Gmail API, Adzuna Jobs API |
| Reverse Proxy | nginx + Let's Encrypt SSL |

## Architecture

```
Browser (Vercel)
    ├── Gmail OAuth  →  jobtracker-auth.ddns.net  →  nginx  →  gmail_backend.py (EC2 :5678)
    └── AI Processing  →  <cloudflare-tunnel>.trycloudflare.com  →  local_server_2.py (:5001)
                                                                          ├── OpenAI API (GPT-4o-mini)
                                                                          └── Adzuna Jobs API
```

### Agentic AI Pipeline

The processing pipeline follows a **Sequential → Parallel → Sequential** pattern:

```
[Sequential]
  Step 1: Fetch emails from Gmail API (paginated)
  Step 2: Rule-based filter (Layer A) — eliminate non-job emails
  Step 3: AI extracts company names (single GPT call)

[Parallel — ThreadPoolExecutor, max 10 workers]
  Step 4: Per-company agents run concurrently:
          Each agent → filter emails → call GPT → extract position/stage/dates

[Sequential]
  Step 5: Merge results, resolve duplicates
  Step 6: Write to cache, stream response to frontend
```

## Project Structure

```
├── frontend/          # React dashboard (deployed on Vercel)
│   └── src/
│       ├── pages/dashboard/   # Dashboard + all components
│       ├── pages/cv-analysis/ # CV upload and analysis
│       ├── pages/job-recommendations/ # Job search
│       └── services/api.js    # All API calls
├── backend/
│   ├── gmail_backend.py       # OAuth 2.0 PKCE handler (EC2)
│   ├── local_server_2.py      # AI processing pipeline (local)
│   ├── firstfilter.py         # Rule-based email filter (Layer A)
│   └── secondfilter.py        # Stage detection patterns
└── Presentation/              # Project presentations
```

## How It Works

1. Connect your Gmail account via OAuth 2.0 PKCE
2. Select a date range to scan
3. The agentic pipeline runs:
   - Rule-based filter eliminates non-job emails
   - AI agent extracts company names from ATS-routed emails
   - Parallel AI agents analyze each company's email thread
   - Results merged, cached, and streamed to dashboard
4. View your complete application journey on the dashboard
5. Bottleneck Insights detects where you're stalling and links to HKU CEDARS resources
6. Optionally upload your CV for AI-powered analysis and job recommendations

## Screenshots

### Homepage

![Homepage](homepage_screenshot.png)

### Application Funnel & Journey Timeline

![Dashboard - Funnel and Timeline](frontend/public/main_page_img1.png)

Track your applications through each stage with the funnel view, and see your complete application journey with company-by-company progress tracking.

### Performance Analytics & AI Insights

![Dashboard - Analytics](frontend/public/main_page_img2.png)

Get insights into your job search performance including response rates, average response times, and AI-powered bottleneck detection with HKU CEDARS resource recommendations.

## License

This project is part of a Final Year Project (FYP) at HKU (COMP4801).
