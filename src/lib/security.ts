export const sha256Hex = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const hashCampaignStaffPin = (campaignId: string, pin: string) =>
  sha256Hex(`${campaignId}:${pin.replace(/\D/g, "").slice(0, 6)}`);
