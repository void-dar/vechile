import Questionnaire from "@/app/components/Questionaire";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-r from-blue-150 to-blue-100 px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-xl font-semibold uppercase tracking-widest text-slate-900 mb-13">
            PulseForm
      </h2>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10">
          
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-10">
            Student Community Access Support Form
          </h1>
          <p className="mt-2 text-slate-800 text-sm mb-4">
          Hello, Thank you for taking the time to support this effort. We are currently building connections with student communities across Nigeria and would appreciate your help in identifying students and school contacts within your network. Please share up to 10 student contacts that you know personally or through family, friends, church members, colleagues, or your wider network. Every contact helps us expand our reach and connect with more student communities across the country. Thank you for your support.
          </p>
          <p className="mt-2 text-slate-500 text-sm mb-4">
            All fields marked with <span className="text-red-500">*</span> are required.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-light-blue shadow-sm">
          <Questionnaire />
        </div>
      </div>
    </main>
  );
}