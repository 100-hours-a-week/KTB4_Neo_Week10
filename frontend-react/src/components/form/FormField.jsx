export default function FormField({ label, htmlFor, error, children }) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error !== undefined && (
        <p className="helper-text" aria-live="polite">
          {error || "* helper text"}
        </p>
      )}
    </div>
  );
}
