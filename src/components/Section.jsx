export default function Section({ id, className = '', children }) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-border/60 py-20 sm:py-28 ${className}`.trim()}>
      <div className="mx-auto w-full max-w-5xl px-6">{children}</div>
    </section>
  )
}
