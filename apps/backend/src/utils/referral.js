export const createReferralCode = (name = "FZ") => {
  const prefix = name.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase() || "FZ";
  return `${prefix}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};
