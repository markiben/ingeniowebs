export default function AuthDivider({ label = "o" }: { label?: string }) {
  return (
    <div className="plat-auth-divider" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}
