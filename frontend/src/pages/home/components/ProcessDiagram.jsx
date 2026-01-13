export default function ProcessDiagram() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Understanding the Job Application Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A typical job application journey from submission to offer.
          </p>
        </div>

        <div className="relative h-[600px] overflow-hidden rounded-2xl shadow-2xl border bg-gray-100">
          <img
            src="https://static.readdy.ai/image/3d4cabd27e900e03269e83df1f663624/cfd9d33ee90dded4480949fc44085be0.png"
            className="absolute inset-0 w-full h-full object-contain"
            alt="Job Application Process Diagram"
          />
        </div>
      </div>
    </section>
  );
}
