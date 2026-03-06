import React, { useState } from "react";

type Align = "left" | "center" | "right" | "justify";

type Props = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  style?: React.CSSProperties;
  align?: Align;
};

export function EditableWidgetText({
  value,
  onChange,
  className,
  style,
  align = "left",
}: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onPointerDown={(e) => e.stopPropagation()}
        className={className}
        style={{
          ...style,
          width: "100%",
          background: "transparent",
          border: "1px dashed #22d3ee",
          outline: "none",
          resize: "none",
          color: "inherit",
          textAlign: align,
          font: "inherit",
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Doble click para editar"
      className={className}
      style={{ ...style, cursor: "text", textAlign: align, whiteSpace: "pre-wrap" }}
    >
      {value}
    </div>
  );
}
