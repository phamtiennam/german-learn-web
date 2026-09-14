export default function PlaceholderScreen({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-2 px-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
      <p className="text-slate-400">{subtitle}</p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-700 bg-slate-900 px-4 py-8 text-center text-sm text-slate-500">
        Coming in a later phase.
      </div>
    </div>
  )
}
