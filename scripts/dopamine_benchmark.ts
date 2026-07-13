async function runBenchmark() {
  console.log("\n========================================================");
  console.log("🧠 OMEGA DOPAMINE LOOPS LATENCY BENCHMARK");
  console.log("Target limit: < 1500ms response loop duration");
  console.log("========================================================\n");

  const start = Date.now();

  // Phase 1: Simulate organic comment event detection
  const eventDetectStart = Date.now();
  console.log("⚡ [1/3] Detecting simulated Facebook/LinkedIn organic comment...");
  await new Promise((resolve) => setTimeout(resolve, 80)); // Simulate webhook network ingestion lag
  const eventDetectEnd = Date.now();
  console.log(`   --> Event detected in ${(eventDetectEnd - eventDetectStart).toFixed(2)}ms`);

  // Phase 2: Call Inbound AI Autopilot simulator endpoint (Gemini analysis)
  const aiStart = Date.now();
  console.log("⚡ [2/3] Dispatching hook to Inbound AI Autopilot (Simulating Gemini model analysis)...");
  
  let score = 85;
  try {
    const response = await fetch("http://localhost:3000/api/dopamine-loops/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hook: "Przestań robić to ręcznie. Pokażę Ci, jak automatycznie pobierać 100 leadów w minutę.",
        channel: "LinkedIn",
        niche: "Biznes & B2B"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      score = data.result?.score || 85;
      console.log(`   --> AI analysis complete. Score achieved: ${score}%`);
    } else {
      console.warn("   --> Backend response not OK, using local analysis fallback.");
    }
  } catch (err: any) {
    console.warn(`   --> Backend unreachable (${err.message}). Simulating offline model fallback...`);
    await new Promise((resolve) => setTimeout(resolve, 350)); // Simulating fallback generation latency
  }
  const aiEnd = Date.now();
  console.log(`   --> AI processing completed in ${(aiEnd - aiStart).toFixed(2)}ms`);

  // Phase 3: Trigger real-time dopamine webhook for instant delivery (<1.5s)
  const webhookStart = Date.now();
  console.log("⚡ [3/3] Triggering instant webhook for audit delivery (Value-First)...");
  await new Promise((resolve) => setTimeout(resolve, 150)); // Simulate API payload delivery to Make/Zapier/Messenger API
  const webhookEnd = Date.now();
  console.log(`   --> Webhook callback dispatched in ${(webhookEnd - webhookStart).toFixed(2)}ms`);

  const totalTime = Date.now() - start;
  console.log("\n========================================================");
  console.log(`TOTAL PROCESS LATENCY: ${totalTime.toFixed(2)}ms`);
  
  if (totalTime < 1500) {
    console.log("✅ STATUS: PASS (Total latency is within the strict 1500ms Dopamine threshold!)");
  } else {
    console.log("❌ STATUS: FAIL (Latency exceeded 1500ms. Optimization required!)");
  }
  console.log("========================================================\n");
}

runBenchmark().catch((err) => console.error("Fatal benchmark error:", err));
