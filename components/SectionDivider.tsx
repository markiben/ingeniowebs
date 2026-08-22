type SectionDividerVariant =
  | "to-light"
  | "to-light-flip"
  | "to-dark"
  | "to-dark-over"
  | "surface-to-contact";

export default function SectionDivider({ variant }: { variant: SectionDividerVariant }) {
  const overlay = variant === "to-dark-over";

  return (
    <div
      className={`section-divider${overlay ? " is-overlay" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="section-divider-svg"
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
      >
        {variant === "surface-to-contact" ? (
          <>
            <polygon points="0,0 1440,0 0,56" fill="#f5f5f7" />
            <polygon points="0,56 1440,0 1440,56" fill="#ffffff" />
          </>
        ) : variant === "to-light" ? (
          <>
            <polygon points="0,0 1440,0 0,56" fill="#000000" />
            <polygon points="0,56 1440,0 1440,56" fill="#f5f5f7" />
          </>
        ) : variant === "to-light-flip" ? (
          <>
            <polygon points="0,0 1440,0 1440,56" fill="#000000" />
            <polygon points="0,0 0,56 1440,56" fill="#f5f5f7" />
          </>
        ) : variant === "to-dark-over" ? (
          /* Only the black cut — previous section bg shows through */
          <polygon points="0,56 1440,0 1440,56" fill="#000000" />
        ) : (
          <>
            <polygon points="0,0 1440,0 0,56" fill="#f5f5f7" />
            <polygon points="0,56 1440,0 1440,56" fill="#000000" />
          </>
        )}
      </svg>
    </div>
  );
}
