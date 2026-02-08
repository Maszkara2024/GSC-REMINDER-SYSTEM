import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: "Missing to or message" });
  }

  try {
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to: to
    });

    res.status(200).json({ success: true, sid: sms.sid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
