import { Router } from "express";
import { env } from "../config/evnironments.js";

const banksRouter = Router();

banksRouter.get("/", async (req, res, next) => {
  try {
    if (!env.CHAPA_SECRET_KEY) {
      return res.status(500).json({
        message: "Missing Chapa secret key"
      });
    }

    const response = await fetch("https://api.chapa.co/v1/banks", {
      headers: {
        Authorization: `Bearer ${env.CHAPA_SECRET_KEY}`
      }
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        message:
          payload?.message || payload?.error || "Failed to load bank list"
      });
    }

    const banks = Array.isArray(payload?.data)
      ? payload.data
          .map((bank) => ({
            id: bank?.id ?? bank?.bank_code ?? bank?.code ?? "",
            name: bank?.name ?? bank?.bank_name ?? ""
          }))
          .filter((bank) => Boolean(bank.id && bank.name))
      : [];

    return res.status(200).json({ banks });
  } catch (error) {
    return next(error);
  }
});

export default banksRouter;
