import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Upload, Check, Plus, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NbButton, SectionTitle } from "@/components/UI";
import { toast } from "sonner";

const steps = ["Basics", "Photos", "Details", "Wants", "Publish"];

const CreateListing = () => {
  const { categories, addListing } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    type: "product",
    title: "",
    description: "",
    category: "fashion",
    condition: "Good",
    estValue: "",
    location: "",
    tags: [],
    tagInput: "",
    wants: [],
    images: ["https://images.unsplash.com/photo-1560264280-88b68371db39?w=800"],
  });

  const upd = (k, v) => setForm({ ...form, [k]: v });

  const next = () => step < steps.length - 1 && setStep(step + 1);
  const back = () => step > 0 && setStep(step - 1);

  const publish = () => {
    addListing({
      type: form.type,
      title: form.title || "Untitled listing",
      description: form.description || "-",
      category: form.category,
      condition: form.condition,
      estValue: Number(form.estValue) || 0,
      location: form.location || "Somewhere",
      tags: form.tags,
      wants: form.wants,
      images: form.images,
    });
    toast.success("Listing live! 🎉");
    nav("/app/feed");
  };

  const addTag = () => {
    if (form.tagInput.trim()) {
      upd("tags", [...form.tags, form.tagInput.trim()]);
      upd("tagInput", "");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="create-page">
      <SectionTitle kicker={`STEP ${step + 1} OF ${steps.length}`}>Post your swap.</SectionTitle>

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
                      onClick={() => upd("type", t)}
                      className={`nb-btn py-4 rounded-xl font-bold text-sm uppercase ${form.type === t ? "bg-black text-white" : "bg-[var(--surface)]"}`}
                      data-testid={`create-type-${t}`}
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
            <>
              <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Photos</label>
              <div className="grid grid-cols-3 gap-2">
                {form.images.map((img, i) => (
                  <div key={i} className="relative aspect-square nb-border-2 rounded-lg overflow-hidden">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                    {i > 0 && (
                      <button
                        onClick={() => upd("images", form.images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-6 h-6 nb-border-2 rounded-full bg-[var(--surface)] flex items-center justify-center"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => upd("images", [...form.images, `https://picsum.photos/seed/${Date.now()}/400/400`])}
                  className="aspect-square border border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center gap-1 text-[var(--text-3)] hover:tint-amber"
                  data-testid="create-add-photo"
                >
                  <Upload size={20} strokeWidth={2.5} />
                  <span className="text-xs font-bold">ADD</span>
                </button>
              </div>
              <p className="text-xs text-[var(--text-3)] font-mono2">Real listings would use file upload. Mock uses random images.</p>
            </>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => upd("condition", e.target.value)}
                    className="nb-input"
                    data-testid="create-condition"
                  >
                    {["New", "Like new", "Good", "Loved", "Vintage", "Service"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Est. value ($)</label>
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
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => upd("location", e.target.value)}
                  placeholder="Brooklyn, NY"
                  className="nb-input"
                  data-testid="create-location"
                />
              </div>
              <div>
                <label className="text-xs font-mono2 uppercase font-bold mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={form.tagInput}
                    onChange={(e) => upd("tagInput", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="e.g. vintage, denim"
                    className="nb-input flex-1"
                    data-testid="create-tag-input"
                  />
                  <NbButton variant="dark" onClick={addTag} data-testid="create-add-tag">
                    <Plus size={16} strokeWidth={3} />
                  </NbButton>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <span key={t} className="nb-tag bg-[var(--surface)] flex items-center gap-1">
                      {t}
                      <button onClick={() => upd("tags", form.tags.filter((x) => x !== t))}>
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
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => upd("wants", form.wants.includes(c.id) ? form.wants.filter((w) => w !== c.id) : [...form.wants, c.id])}
                    className={`nb-btn px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 border ${form.wants.includes(c.id) ? "bg-[var(--lime)] text-black border-transparent" : c.tint}`}
                    data-testid={`create-want-${c.id}`}
                  >
                    <span>{c.emoji}</span> {c.name}
                    {form.wants.includes(c.id) && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="text-6xl mb-3 pop-in">🚀</div>
              <div className="font-display text-3xl mb-2">Ready to launch?</div>
              <p className="text-sm text-[var(--text-2)] mb-6">Preview below. You can edit anytime.</p>
              <div className="nb-card p-4 bg-[var(--surface-2)] text-left">
                <img src={form.images[0]} className="w-full h-40 object-cover nb-border-2 rounded-lg mb-3" alt="" />
                <div className="font-display text-xl">{form.title || "Untitled"}</div>
                <div className="text-sm mt-1 text-[var(--text-2)]">{form.description || "-"}</div>
                <div className="text-xs font-mono2 mt-2">~${form.estValue || 0} · {form.condition}</div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        {step > 0 ? (
          <NbButton variant="light" onClick={back} data-testid="create-back">
            <ArrowLeft size={16} strokeWidth={3} /> Back
          </NbButton>
        ) : <div />}
        {step < steps.length - 1 ? (
          <NbButton onClick={next} data-testid="create-next">
            Continue <ArrowRight size={16} strokeWidth={3} />
          </NbButton>
        ) : (
          <NbButton onClick={publish} data-testid="create-publish">
            Publish listing <ArrowRight size={16} strokeWidth={3} />
          </NbButton>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
