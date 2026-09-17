<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/654a25c6-6136-4c5e-b82e-d39e70e36486

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Flowchart Compliance

The attached DentCare appointment flowchart is treated as the business-process source of truth. The implementation now enforces the primary patient journey and the four exception flows through the booking wizard, appointment lifecycle state machine, notification dispatcher, waitlist logic, no-show booking gate, emergency scheduler, and follow-up reminder scheduler.

See [`FLOWCHART_TRACEABILITY.md`](./FLOWCHART_TRACEABILITY.md) for the step-by-step traceability map and implementation controls.

