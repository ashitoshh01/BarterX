import React, { useRef, useState, useEffect } from "react";
import { Upload, X, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";

export const ImageUploader = ({ files, onChange }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState([]);

  // Generate previews when files change
  useEffect(() => {
    // Generate object URLs
    const objectUrls = files.map((file) => {
      if (file instanceof File) {
        return URL.createObjectURL(file);
      }
      return file; // if it's already a preview URL string
    });

    setPreviews(objectUrls);

    // Cleanup object URLs on change or unmount
    return () => {
      objectUrls.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const handleFiles = (newFiles) => {
    const validFiles = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    for (let file of newFiles) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} has unsupported type. Only JPG, PNG, and WEBP are supported.`);
        continue;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const updatedFiles = [...files, ...validFiles];
    if (updatedFiles.length > 5) {
      toast.error("Maximum 5 images allowed.");
      onChange(updatedFiles.slice(0, 5));
    } else {
      onChange(updatedFiles);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const moveImage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    
    const reordered = [...files];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    onChange(reordered);
  };

  const makeCover = (index) => {
    if (index === 0) return;
    const reordered = [...files];
    const [target] = reordered.splice(index, 1);
    reordered.unshift(target);
    onChange(reordered);
  };

  const triggerInput = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerInput();
    }
  };

  return (
    <div className="space-y-4" onDragEnter={handleDrag}>
      <input
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <div 
        className={`grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl border-3 border-dashed transition-all ${
          dragActive 
            ? "border-[var(--lime)] bg-[var(--lime)]/5 scale-[0.99]" 
            : "border-white/10 bg-black/20 hover:border-white/20"
        }`}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {previews.map((src, i) => (
          <div key={i} className="relative aspect-square nb-border-2 rounded-lg overflow-hidden group bg-[var(--surface-2)]">
            <img src={src} className="w-full h-full object-cover" alt={`Upload ${i + 1}`} />
            
            {/* Dynamic labels */}
            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[9px] font-mono2 text-center py-1 text-white flex items-center justify-center gap-1">
              {i === 0 ? (
                <span className="flex items-center gap-0.5 text-[var(--lime)] font-bold">
                  <Star size={9} className="fill-[var(--lime)]" /> COVER IMAGE
                </span>
              ) : (
                `IMAGE #${i + 1}`
              )}
            </div>

            {/* Top Action controls */}
            <div className="absolute top-1.5 inset-x-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, -1)}
                    className="w-5 h-5 rounded bg-black/85 text-white flex items-center justify-center hover:bg-black"
                    title="Move left"
                  >
                    <ArrowLeft size={10} strokeWidth={2.5} />
                  </button>
                )}
                {i < previews.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, 1)}
                    className="w-5 h-5 rounded bg-black/85 text-white flex items-center justify-center hover:bg-black"
                    title="Move right"
                  >
                    <ArrowRight size={10} strokeWidth={2.5} />
                  </button>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="w-5 h-5 rounded bg-black/85 text-[var(--lime)] flex items-center justify-center hover:bg-black"
                    title="Set as Cover"
                  >
                    <Star size={10} strokeWidth={2.5} className="fill-[var(--lime)]" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="w-5 h-5 rounded bg-[var(--pink)] text-white flex items-center justify-center hover:bg-red-600"
                title="Remove image"
              >
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}

        {files.length < 5 && (
          <button
            type="button"
            onClick={triggerInput}
            onKeyDown={handleKeyDown}
            className="aspect-square border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center gap-1.5 text-[var(--text-3)] hover:border-white/20 hover:text-white transition-all outline-none focus:border-[var(--lime)]"
            data-testid="create-add-photo"
          >
            <Upload size={20} strokeWidth={2.5} />
            <span className="text-xs font-bold font-mono2 uppercase">ADD PHOTO</span>
          </button>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-[var(--text-3)] font-mono2 px-1">
        <span>Accepted: JPG, PNG, WEBP (Max 10MB per file)</span>
        <span>{files.length}/5 Selected</span>
      </div>
    </div>
  );
};

export default ImageUploader;
