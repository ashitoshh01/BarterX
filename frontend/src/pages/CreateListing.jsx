import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Plus, X, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton, SectionTitle } from "@/components/UI";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import { reverseGeocode } from "@/lib/geocoding";

const steps = ["Basics", "Photos", "Details", "Wants", "Publish"];

const CreateListing = () => {
  const { id } = useParams();
  const { categories, addListing, listings, editListing } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);

  const existingListing = id ? listings.find((l) => String(l.id) === String(id)) : null;

  const [locating, setLocating] = useState(false);

  const [form, setForm] = useState({
    type: "product",
    title: "",
    description: "",
    category: "",
    condition: "Good",
    estValue: "",
    location: "",
    location_name: "",
    city: "",
    state: "",
    country: "",
    latitude: null,
    longitude: null,
    tags: [],
    tagInput: "",
    wants: [],
    images: [],
    status: "active",
  });

  const [coverPreview, setCoverPreview] = useState("");

  const isInitializedRef = useRef(false);

  // Pre-load listing data in Edit Mode
  useEffect(() => {
    if (id && existingListing && !isInitializedRef.current) {
      setForm({
        type: existingListing.type || "product",
        title: existingListing.title || "",
        description: existingListing.description || "",
        category: existingListing.category || "",
        condition: existingListing.condition || "Good",
        estValue: existingListing.estValue || "",
        location: existingListing.location || "",
        location_name: existingListing.location_name || existingListing.location || "",
        city: existingListing.city || "",
        state: existingListing.state || "",
        country: existingListing.country || "",
        latitude: existingListing.latitude ?? null,
        longitude: existingListing.longitude ?? null,
        tags: existingListing.tags || [],
        tagInput: "",
        wants: existingListing.wants || [],
        images: existingListing.images || [],
        status: existingListing.status || "active",
      });
      isInitializedRef.current = true;
    }
  }, [id, existingListing]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    const tid = toast.loading("Detecting listing location...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lng);
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          location_name: geo.location_name,
          city: geo.city,
          state: geo.state,
          country: geo.country,
          location: geo.location_name || prev.location,
        }));
        setLocating(false);
        toast.success(`Location set: ${geo.location_name}`, { id: tid });
      },
      (err) => {
        setLocating(false);
        let msg = "Failed to capture location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. You can still publish without coordinates.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location position unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out.";
        }
        toast.error(msg, { id: tid });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Draft recovery prompt
  useEffect(() => {
    const draftKey = id ? `draft_edit_${id}` : "draft_create";
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasContent = parsed.title || parsed.description || (parsed.images && parsed.images.length > 0);
        if (hasContent) {
          const restore = window.confirm("Restore previous draft?");
          if (restore) {
            setForm({
              ...parsed,
              images: parsed.images ? parsed.images.filter(x => typeof x === "string") : []
            });
            toast.success("Draft restored!");
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      } catch (e) {
        console.error("Failed to parse draft:", e);
      }
    }
  }, [id]);

  // Autosave interval every 30 seconds
  useEffect(() => {
    const draftKey = id ? `draft_edit_${id}` : "draft_create";
    if (!form.title && !form.description && form.images.length === 0) return;
    const interval = setInterval(() => {
      const serializableForm = {
        ...form,
        images: form.images.filter(x => typeof x === "string")
      };
      localStorage.setItem(draftKey, JSON.stringify(serializableForm));
    }, 30000);
    return () => clearInterval(interval);
  }, [form, id]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Pre-load default category if not set
  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((prev) => ({ ...prev, category: categories[0].id }));
    }
  }, [categories, form.category]);

  // Cover image preview generation
  useEffect(() => {
    const file = form.images[0];
    if (!file) {
      setCoverPreview("");
      return;
    }
    let url;
    if (file instanceof File) {
      url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(file);
    }
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [form.images]);

  const upd = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const next = () => {
    if (step === 1 && form.images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    if (step < steps.length - 1) setStep(step + 1);
  };
  const back = () => step > 0 && setStep(step - 1);

  const publish = async () => {
    if (form.images.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }
    setPending(true);
    const modeText = id ? "Updating" : "Publishing";
    const tid = toast.loading(`${modeText} listing...`);
    try {
      if (id) {
        await editListing(id, {
          title: form.title,
          description: form.description,
          category: form.category,
          condition: form.condition,
          estValue: Number(form.estValue) || 0,
          location: form.location,
          location_name: form.location_name,
          city: form.city,
          state: form.state,
          country: form.country,
          latitude: form.latitude,
          longitude: form.longitude,
          wants: form.wants,
          images: form.images,
          status: form.status,
        });
        toast.success("Listing updated successfully! 🎉", { id: tid });
      } else {
        await addListing({
          type: form.type,
          title: form.title || "Untitled listing",
          description: form.description || "-",
          category: form.category,
          condition: form.condition,
          estValue: Number(form.estValue) || 0,
          location: form.location || "Somewhere",
          location_name: form.location_name,
          city: form.city,
          state: form.state,
          country: form.country,
          latitude: form.latitude,
          longitude: form.longitude,
          tags: form.tags,
          wants: form.wants,
          images: form.images,
        });
        toast.success("Listing live! 🎉", { id: tid });
      }
      localStorage.removeItem(id ? `draft_edit_${id}` : "draft_create");
      nav("/app/feed");
    } catch (err) {
      toast.error(err.message || `Failed to ${id ? "update" : "publish"} listing.`, { id: tid });
    } finally {
      setPending(false);
    }
  };

  const addTag = () => {
    if (form.tagInput.trim()) {
      if (!form.tags.includes(form.tagInput.trim())) {
        upd("tags", [...form.tags, form.tagInput.trim()]);
      }
      upd("tagInput", "");
    }
  };

  // Redirect if Completed listing is requested to be edited
  if (id && existingListing?.status === "traded") {
    return (
      <div className="p-10 text-center space-y-4 max-w-lg mx-auto bg-[var(--surface)] nb-card mt-12">
        <div className="text-6xl">🔒</div>
        <h2 className="font-display text-3xl">Completed Listing</h2>
        <p className="text-sm text-[var(--text-2)]">This listing is completed (traded) and cannot be modified.</p>
        <NbButton onClick={() => nav("/app/feed")}>Return to Feed</NbButton>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="create-page">
      <SectionTitle kicker={`STEP ${step + 1} OF ${steps.length}`}>{id ? "Edit your swap." : "Post your swap."}</SectionTitle>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-2 rounded-full nb-border-2 ${i <= step ? "bg-[var(--lime)]" : "bg-[var(--surface)]"}`} />
            <div className="text-[10px] font-mono2 uppercase mt-1 text-center">{s}</div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="nb-card p-6 bg-[var(--surface)] space-y-4"
          data-testid={`create-step-${step}`}
        >
          {step === 0 && (
            <>
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {["product", "service"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => upd("type", t)}
                      className={`nb-btn py-4 rounded-xl font-bold text-sm uppercase ${form.type === t ? "bg-[var(--text)] text-white" : "bg-[var(--surface)]"}`}
                      data-testid={`create-type-${t}`}
                      disabled={!!id} // type shouldn't change during edit
                    >
                      {t === "product" ? "📦 Product" : "🎨 Service"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => upd("title", e.target.value)}
                  placeholder="e.g. Vintage denim jacket size M"
                  className="nb-input"
                  data-testid="create-title"
                />
              </div>
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter((c) => form.type === "service" ? c.type === "service" : c.type !== "service").map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => upd("category", c.id)}
                      className={`nb-btn px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border ${form.category === c.id ? "bg-[var(--lime)] text-black border-transparent" : c.tint}`}
                      data-testid={`create-cat-${c.id}`}
                    >
                      <span>{c.emoji}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <ImageUploader files={form.images} onChange={(files) => upd("images", files)} />
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => upd("description", e.target.value)}
                  rows={4}
                  placeholder="Tell the story of this item..."
                  className="nb-input resize-none"
                  data-testid="create-desc"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => upd("condition", e.target.value)}
                    className="nb-input bg-[var(--surface-2)] text-[var(--text)]"
                    data-testid="create-condition"
                  >
                    {["New", "Like New", "Good", "Fair", "Needs Repair", "Digital Item", "Service"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Est. value (₹)</label>
                  <input
                    type="number"
                    value={form.estValue}
                    onChange={(e) => upd("estValue", e.target.value)}
                    placeholder="80"
                    className="nb-input"
                    data-testid="create-value"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="text-xs font-mono2 uppercase font-bold block">Location</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className="nb-btn text-xs px-2.5 py-1 rounded-lg font-bold bg-[var(--lime)] text-black flex items-center gap-1 shadow-sm"
                    data-testid="create-use-location"
                  >
                    <MapPin size={12} /> {locating ? "Detecting..." : "Use My Current Location"}
                  </button>
                </div>
                <input
                  value={form.location}
                  onChange={(e) => upd("location", e.target.value)}
                  placeholder="e.g. Hostel Block A, Room 204, Pune"
                  className="nb-input"
                  data-testid="create-location"
                />
                {form.latitude !== null && form.longitude !== null && (
                  <div className="text-[11px] font-mono2 text-[var(--lime)] flex items-center gap-1">
                    <MapPin size={10} /> Attached Coordinates: {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
                  </div>
                )}
              </div>

              {id && (
                <div className="space-y-1 mt-2">
                  <label className="text-xs font-mono2 uppercase font-bold mb-1.5 block">Availability Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => upd("status", e.target.value)}
                    className="nb-input w-full bg-[var(--surface-2)] text-[var(--text)]"
                  >
                    {existingListing?.status === "active" && (
                      <>
                        <option value="active">🟢 Active</option>
                        <option value="reserved">🟡 Reserved</option>
                        <option value="archived">⚪ Archived</option>
                      </>
                    )}
                    {existingListing?.status === "reserved" && (
                      <>
                        <option value="reserved">🟡 Reserved</option>
                        <option value="active">🟢 Active</option>
                        <option value="traded">🔵 Completed</option>
                      </>
                    )}
                    {existingListing?.status === "archived" && (
                      <>
                        <option value="archived">⚪ Archived</option>
                        <option value="active">🟢 Active</option>
                      </>
                    )}
                    {existingListing?.status === "traded" && (
                      <option value="traded">🔵 Completed</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.tagInput || ""}
                    onChange={(e) => upd("tagInput", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="e.g. vintage, denim"
                    className="nb-input flex-1"
                    data-testid="create-tag-input"
                  />
                  <NbButton variant="dark" onClick={addTag} data-testid="create-add-tag" type="button">
                    <Plus size={16} strokeWidth={3} />
                  </NbButton>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <span key={t} className="nb-tag bg-[var(--surface-2)] flex items-center gap-1">
                      {t}
                      <button type="button" onClick={() => upd("tags", form.tags.filter((x) => x !== t))}>
                        <X size={10} strokeWidth={3} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">What do you want in return?</label>
              <p className="text-sm font-medium text-[var(--text-2)] mb-3">Pick categories you'd swap for. This powers your AI matches.</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const isSelected = form.wants.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => upd("wants", isSelected ? form.wants.filter((w) => w !== c.id) : [...form.wants, c.id])}
                      className={`nb-btn px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border ${isSelected ? "bg-[var(--lime)] text-black border-transparent" : c.tint}`}
                      data-testid={`create-want-${c.id}`}
                    >
                      <span>{c.emoji}</span> {c.name}
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="text-6xl mb-3 pop-in">🚀</div>
              <div className="font-display text-3xl mb-2">{id ? "Save edits?" : "Ready to launch?"}</div>
              <p className="text-sm text-[var(--text-2)] mb-6">Preview below. You can edit anytime.</p>
              <div className="nb-card p-4 bg-[var(--surface-2)] text-left space-y-2 max-w-sm mx-auto">
                <img
                  src={coverPreview || "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"}
                  className="w-full h-40 object-cover nb-border-2 rounded-lg"
                  alt=""
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=800"; }}
                />
                <div className="font-display text-xl">{form.title || "Untitled"}</div>
                <div className="text-sm text-[var(--text-2)] line-clamp-2">{form.description || "-"}</div>
                <div className="pt-2 border-t border-[var(--border)] space-y-1">
                  <div className="text-xs"><span className="text-[var(--text-3)] font-mono2 uppercase">Estimated Value:</span> <span className="font-bold">₹{form.estValue || 0}</span></div>
                  <div className="text-xs"><span className="text-[var(--text-3)] font-mono2 uppercase">Condition:</span> <span className="font-bold">{form.condition}</span></div>
                  <div className="text-xs"><span className="text-[var(--text-3)] font-mono2 uppercase">Looking For:</span> <span className="font-bold">{form.wants && form.wants.length > 0 ? form.wants.join(", ") : "Open to Offers"}</span></div>
                  {id && <div className="text-xs"><span className="text-[var(--text-3)] font-mono2 uppercase">Status:</span> <span className="font-bold uppercase">{form.status}</span></div>}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        {step > 0 ? (
          <NbButton variant="light" onClick={back} data-testid="create-back" type="button" disabled={pending}>
            <ArrowLeft size={16} strokeWidth={3} /> Back
          </NbButton>
        ) : <div />}
        {step < steps.length - 1 ? (
          <NbButton onClick={next} data-testid="create-next" type="button" disabled={pending}>
            Continue <ArrowRight size={16} strokeWidth={3} />
          </NbButton>
        ) : (
          <NbButton onClick={publish} data-testid="create-publish" type="button" disabled={pending}>
            {id ? "Save changes" : "Publish listing"} <ArrowRight size={16} strokeWidth={3} />
          </NbButton>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
