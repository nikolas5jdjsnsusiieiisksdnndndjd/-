require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const letterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Забагато спроб. Будь ласка, спробуйте трохи пізніше." }
});

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

app.post("/api/letters", letterLimiter, async (req, res) => {
  try {
    // Honeypot: приховане поле для відсікання простих ботів.
    if (req.body.website) return res.json({ ok: true });

    const name = clean(req.body.name, 80);
    const age = clean(req.body.age, 3);
    const city = clean(req.body.city, 100);
    const letter = clean(req.body.letter, 5000);
    const parentEmail = clean(req.body.parentEmail, 160);

    if (!name || !city || letter.length < 10) {
      return res.status(400).json({ error: "Будь ласка, заповніть ім’я, місто та лист (від 10 символів)." });
    }
    if (age && (!/^\d{1,2}$/.test(age) || Number(age) < 1 || Number(age) > 17)) {
      return res.status(400).json({ error: "Перевірте, будь ласка, вік." });
    }
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
      return res.status(503).json({ error: "Пошта ще не налаштована. Спробуйте пізніше." });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const safeParentEmail = parentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)
      ? parentEmail : "Не вказано";

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO,
      subject: `🎄 Новий лист від ${name} — Пошта Святого Миколая`,
      text: [
        "Надійшов новий лист на сайті «Пошта Святого Миколая».",
        "",
        `Ім’я: ${name}`,
        `Вік: ${age || "Не вказано"}`,
        `Місто: ${city}`,
        `Email дорослого для відповіді: ${safeParentEmail}`,
        "",
        "Текст листа:",
        letter
      ].join("\n")
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Letter delivery error:", error.message);
    res.status(500).json({ error: "Не вдалося надіслати лист. Спробуйте ще раз трохи пізніше." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Пошта Святого Миколая працює: http://localhost:${PORT}`));
