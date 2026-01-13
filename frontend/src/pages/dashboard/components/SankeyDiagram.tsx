import Plot from 'react-plotly.js';

interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
  appliedDate: string;
  lastUpdate: string;
  stage: string;
  emails: number;
  tests: {
    aptitude: string | null;
    simulation: string | null;
    coding: string | null;
    video: string | null;
  };
  interviews: number;
}

interface SankeyDiagramProps {
  applications: Application[];
}

export default function SankeyDiagram({ applications }: SankeyDiagramProps) {
  const total = applications.length;

  // Calculate flow data
  const applied = total;

  // From Applied
  const appliedToAssessment = applications.filter(
    app => app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video
  ).length;
  const appliedToRejectedDirectly = applications.filter(
    app => app.status === 'Rejection' &&
      !app.tests?.aptitude && !app.tests?.simulation && !app.tests?.coding && !app.tests?.video &&
      app.interviews === 0
  ).length;
  const appliedPending = applications.filter(
    app => app.status !== 'Rejection' && app.status !== 'Offer' &&
      !app.tests?.aptitude && !app.tests?.simulation && !app.tests?.coding && !app.tests?.video &&
      app.interviews === 0
  ).length;

  // From Assessment
  const assessmentToInterview = applications.filter(
    app => (app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video) &&
      app.interviews > 0
  ).length;
  const assessmentToRejected = applications.filter(
    app => app.status === 'Rejection' &&
      (app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video) &&
      app.interviews === 0
  ).length;
  const assessmentPending = applications.filter(
    app => app.status !== 'Rejection' && app.status !== 'Offer' &&
      (app.tests?.aptitude || app.tests?.simulation || app.tests?.coding || app.tests?.video) &&
      app.interviews === 0
  ).length;

  // From Interview
  const interviewToOffer = applications.filter(
    app => app.status === 'Offer'
  ).length;
  const interviewToRejected = applications.filter(
    app => app.status === 'Rejection' && app.interviews > 0
  ).length;
  const interviewPending = applications.filter(
    app => app.status !== 'Rejection' && app.status !== 'Offer' && app.interviews > 0
  ).length;

  // Build Sankey data
  // Nodes: 0=Applied, 1=Assessment, 2=Interview, 3=Offer, 4=Rejected, 5=Pending
  const labels = ['Applied', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Pending'];
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // Applied - blue
    'rgba(249, 115, 22, 0.8)',   // Assessment - orange
    'rgba(147, 51, 234, 0.8)',   // Interview - purple
    'rgba(34, 197, 94, 0.8)',    // Offer - green
    'rgba(239, 68, 68, 0.8)',    // Rejected - red
    'rgba(156, 163, 175, 0.8)',  // Pending - gray
  ];

  // Build links (source, target, value)
  const sources: number[] = [];
  const targets: number[] = [];
  const values: number[] = [];
  const linkColors: string[] = [];

  // Applied -> Assessment
  if (appliedToAssessment > 0) {
    sources.push(0); targets.push(1); values.push(appliedToAssessment);
    linkColors.push('rgba(249, 115, 22, 0.3)');
  }
  // Applied -> Rejected
  if (appliedToRejectedDirectly > 0) {
    sources.push(0); targets.push(4); values.push(appliedToRejectedDirectly);
    linkColors.push('rgba(239, 68, 68, 0.3)');
  }
  // Applied -> Pending
  if (appliedPending > 0) {
    sources.push(0); targets.push(5); values.push(appliedPending);
    linkColors.push('rgba(156, 163, 175, 0.3)');
  }

  // Assessment -> Interview
  if (assessmentToInterview > 0) {
    sources.push(1); targets.push(2); values.push(assessmentToInterview);
    linkColors.push('rgba(147, 51, 234, 0.3)');
  }
  // Assessment -> Rejected
  if (assessmentToRejected > 0) {
    sources.push(1); targets.push(4); values.push(assessmentToRejected);
    linkColors.push('rgba(239, 68, 68, 0.3)');
  }
  // Assessment -> Pending
  if (assessmentPending > 0) {
    sources.push(1); targets.push(5); values.push(assessmentPending);
    linkColors.push('rgba(156, 163, 175, 0.3)');
  }

  // Interview -> Offer
  if (interviewToOffer > 0) {
    sources.push(2); targets.push(3); values.push(interviewToOffer);
    linkColors.push('rgba(34, 197, 94, 0.3)');
  }
  // Interview -> Rejected
  if (interviewToRejected > 0) {
    sources.push(2); targets.push(4); values.push(interviewToRejected);
    linkColors.push('rgba(239, 68, 68, 0.3)');
  }
  // Interview -> Pending
  if (interviewPending > 0) {
    sources.push(2); targets.push(5); values.push(interviewPending);
    linkColors.push('rgba(156, 163, 175, 0.3)');
  }

  const hasData = values.length > 0 && values.some(v => v > 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Application Flow</h2>
        <div className="flex items-center text-sm text-gray-500">
          <i className="ri-flow-chart mr-1"></i>
          {total} applications
        </div>
      </div>

      {hasData ? (
        <Plot
          data={[
            {
              type: 'sankey',
              orientation: 'h',
              node: {
                pad: 20,
                thickness: 20,
                line: { color: 'white', width: 1 },
                label: labels,
                color: colors,
              },
              link: {
                source: sources,
                target: targets,
                value: values,
                color: linkColors,
              },
            },
          ]}
          layout={{
            font: { size: 12, family: 'Inter, system-ui, sans-serif' },
            margin: { l: 10, r: 10, t: 10, b: 10 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
          }}
          config={{
            displayModeBar: false,
            responsive: true,
          }}
          style={{ width: '100%', height: '280px' }}
        />
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <i className="ri-flow-chart text-4xl text-gray-300 mb-2"></i>
            <p>No application data to display</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
          <span className="text-gray-600">Applied</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div>
          <span className="text-gray-600">Assessment</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-500 mr-1"></div>
          <span className="text-gray-600">Interview</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
          <span className="text-gray-600">Offer</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
          <span className="text-gray-600">Rejected</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
          <span className="text-gray-600">Pending</span>
        </div>
      </div>
    </div>
  );
}
