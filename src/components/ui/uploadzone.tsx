import React from "react";

interface UploadZoneProps {
  variant?: "cover" | "profile";
  onFileSelect: (file: File) => void;
  className?: string;
}

export function UploadZone({ variant, onFileSelect, className }: UploadZoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className={`${className} flex flex-col items-center justify-center border border-dashed border-border rounded-lg cursor-pointer select-none p-6 text-muted-foreground`}
      onClick={handleClick}
    >
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
      />
      {variant === "cover" ? (
        <p className="text-center">Click or tap to upload cover image</p>
      ) : (
        <p className="text-center">Click or tap to upload profile image</p>
      )}
    </div>
  );
}
