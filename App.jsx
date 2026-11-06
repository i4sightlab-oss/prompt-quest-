import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { missions, finalMission } from "./missions";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const justifications = [
  "It gives the AI a clear role or perspective.",
  "It explains who the learners are and their context.",
  "It tells the AI exactly what to do.",
  "It removes ambiguity and makes expectations clear.",
  "It sets realistic limits and available resources.",
  "It specifies the format and structure of the answer."
];

function App() {
  const [mode, setMode] = useState("home");
  const [sessionCode, setSessionCode] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [team, setTeam] = useState(null);
  const [session, setSession] = useState(null);
  const [missionIndex, setMissionIndex] = useState(0);
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalPrompt, setFinalPrompt] = useState("");
  const [finalSaved, setFinalSaved] = useState(false);

  const current = missions[missionIndex];
  const connected = Boolean(supabase);

  const refreshLeaderboard = async (sid = session?.id) => {
    if (!supabase || !sid) return;
    const { data, error: e } = await supabase
      .from("pq_teams").select("id, team_name, score, completed_stages")
      .eq("session_id", sid).order("score", { ascending: false });
    if (!e) setLeaderboard(data || []);
  };

  useEffect(() => {
    if (!session?.id || !supabase) return;
    refreshLeaderboard(session.id);
    const channel = supabase.channel("pq-leaderboard-" + session.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "pq_teams", filter: `session_id=eq.${session.id}` }, () => refreshLeaderboard(session.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  const joinGame = async (e) => {
    e.preventDefault();
    setError("");
    if (!supabase) { setError("The app has not been connected to Supabase yet. Follow the setup guide."); return; }
    setLoading(true);
    const code = sessionCode.trim().toUpperCase();
    const tcode = teamCode.trim().toUpperCase();
    const { data: s, error: se } = await supabase.from("pq_sessions").select("*").eq("join_code", code).eq("is_active", true).maybeSingle();
    if (se || !s) { setLoading(false); setError("Session not found. Check the session code with your trainer."); return; }
    const { data: t, error: te } = await supabase.from("pq_teams").select("*").eq("session_id", s.id).eq("team_code", tcode).maybeSingle();
    setLoading(false);
    if (te || !t) { setError("Team code not found. Ask your trainer to check it."); return; }
    setSession(s); setTeam(t); setScore(t.score || 0); setCompleted(t.completed_stages || []);
    setMode("game");
  };

  const submitAnswer = async () => {
    if (!choice || !reason) return;
    const isCorrect = choice === current.answer;
    const reasonCorrect = current.id === "role" ? reason === "role" :
      current.id === "context" ? reason === "context" :
      current.id === "task" ? reason === "task" :
      current.id === "clarity" ? reason === "clarity" :
      current.id === "constraints" ? reason === "constraints" : reason === "output";
    const points = isCorrect ? 10 + (reasonCorrect ? 5 : 0) : 0;
    setFeedback({ isCorrect, reasonCorrect, points });
    if (isCorrect && !completed.includes(current.id) && supabase) {
      const { data, error: rpcError } = await supabase.rpc("pq_award_points", {
        p_session_code: session.join_code,
        p_team_code: team.team_code,
        p_stage_id: current.id,
        p_points: points
      });
      if (!rpcError && data) {
        setScore(data.score);
        setCompleted(data.completed_stages || []);
        setTeam({ ...team, score: data.score, completed_stages: data.completed_stages || [] });
      } else {
        setError("Your answer was checked, but the score could not be saved. Please tell the trainer.");
      }
    } else if (isCorrect && !completed.includes(current.id)) {
      setScore(v => v + points);
      setCompleted(v => [...v, current.id]);
    }
    if (isCorrect) refreshLeaderboard(session.id);
  };

  const nextMission = () => {
    setFeedback(null); setChoice(""); setReason(""); setError("");
    if (missionIndex < missions.length - 1) setMissionIndex(v => v + 1);
    else setMode("final");
  };

  const saveFinal = async () => {
    if (!finalPrompt.trim()) return;
    if (supabase && team && session) {
      const { error: e } = await supabase.from("pq_final_prompts").upsert({
        team_id: team.id, session_id: session.id, prompt_text: finalPrompt.trim()
      }, { onConflict: "team_id" });
      if (e) { setError("Could not save the final prompt. Please copy it before leaving."); return; }
    }
    setFinalSaved(true);
  };

  const goLeaderboard = async () => { await refreshLeaderboard(); setMode("leaderboard"); };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">PQ</span><span>PROMPT <b>QUEST</b></span></div>
        <span className="top-tag">TEACHER TRAINING GAME</span>
      </header>

      {mode === "home" && <main className="hero">
        <div className="eyebrow"><span className="pulse"></span> THE AI PROMPT CHALLENGE</div>
        <h1>Unlock the power<br/><em>of better prompts.</em></h1>
        <p className="hero-copy">Six missions. Six keys. One goal: help AI understand exactly what great teaching needs.</p>
        <div className="key-strip">{["ROLE","CONTEXT","TASK","CLARITY","CONSTRAINTS","OUTPUT"].map((k,i)=><span key={k}><small>0{i+1}</small>{k}</span>)}</div>
        <form className="join-card" onSubmit={joinGame}>
          <div className="card-heading"><span>🚀</span><div><h2>Join your team</h2><p>Enter the codes shared by your trainer.</p></div></div>
          <label>SESSION CODE<input value={sessionCode} onChange={e=>setSessionCode(e.target.value)} placeholder="e.g. AZHAR26" required maxLength="20"/></label>
          <label>TEAM CODE<input value={teamCode} onChange={e=>setTeamCode(e.target.value)} placeholder="e.g. TEAM01" required maxLength="20"/></label>
          {error && <p className="error">{error}</p>}
          <button className="primary-btn" disabled={loading}>{loading ? "CONNECTING..." : "ENTER THE QUEST"} <span>→</span></button>
          {!connected && <p className="setup-note">Trainer setup is not complete yet. The app needs its Supabase connection.</p>}
        </form>
        <button className="text-btn" onClick={goLeaderboard}>View team leaderboard ↗</button>
      </main>}

      {mode === "game" && <main className="game-layout">
        <div className="game-meta"><span className="pill">MISSION {missionIndex+1} / 6</span><span className="score-pill">★ {score} POINTS</span></div>
        <div className="progress">{missions.map((m,i)=><span key={m.id} className={i < missionIndex ? "done" : i === missionIndex ? "active" : ""}></span>)}</div>
        <section className="mission-card">
          <div className="mission-icon">{current.icon}</div>
          <div className="eyebrow">UNLOCK KEY {String(missionIndex+1).padStart(2,"0")} · {current.key}</div>
          <h1>{current.title}</h1>
          <p className="instruction">Read the prompt. Is it <b>WEAK</b> or <b>STRONG</b>?</p>
          <div className="prompt-box"><span className="quote-mark">“</span>{current.prompt}<span className="quote-end">”</span></div>
          {!feedback ? <>
            <div className="choice-grid">
              <button className={`choice weak ${choice==="weak"?"selected":""}`} onClick={()=>setChoice("weak")}><span>⚠️</span><b>WEAK PROMPT</b><small>Needs improvement</small></button>
              <button className={`choice strong ${choice==="strong"?"selected":""}`} onClick={()=>setChoice("strong")}><span>⚡</span><b>STRONG PROMPT</b><small>Clear and useful</small></button>
            </div>
            <label className="reason-label">WHICH PROMPT ELEMENT IS BEING TESTED?</label>
            <div className="reason-grid">{["role","context","task","clarity","constraints","output"].map((r)=><button key={r} className={reason===r?"reason selected": "reason"} onClick={()=>setReason(r)}>{r.toUpperCase()}</button>)}</div>
            {error && <p className="error">{error}</p>}
            <button className="primary-btn" disabled={!choice || !reason} onClick={submitAnswer}>CHECK MY ANSWER <span>→</span></button>
          </> : <div className={`feedback ${feedback.isCorrect?"correct":"incorrect"}`}>
            <h3>{feedback.isCorrect ? `Brilliant! +${feedback.points} points` : "Not quite — keep learning!"}</h3>
            <p>{current.explanation}</p>
            <div className="improve"><b>UPGRADE IDEA</b><br/>{current.fix}</div>
            <button className="primary-btn" onClick={nextMission}>{missionIndex===5?"GO TO FINAL MISSION":"NEXT MISSION"} <span>→</span></button>
          </div>}
        </section>
        <aside className="team-footer"><span>TEAM <b>{team?.team_name}</b></span><button onClick={goLeaderboard}>LEADERBOARD ↗</button></aside>
      </main>}

      {mode === "final" && <main className="final-layout">
        <div className="mission-icon">🏆</div><div className="eyebrow">FINAL BOSS · THE PROMPT MAKEOVER</div>
        <h1>Build a prompt<br/><em>that gets results.</em></h1>
        <p className="hero-copy">Your team's final challenge: transform this weak prompt into a classroom-ready instruction.</p>
        <div className="prompt-box"><small>THE WEAK PROMPT</small><br/>“{finalMission.weak}”</div>
        <textarea value={finalPrompt} onChange={e=>setFinalPrompt(e.target.value)} placeholder="Act as a... My learners are... Create... Make sure... Present the result as..." rows="7"/>
        {error && <p className="error">{error}</p>}
        {finalSaved ? <div className="feedback correct"><h3>Quest completed! 🎉</h3><p>Your team's final prompt has been saved.</p></div> :
          <button className="primary-btn" disabled={!finalPrompt.trim()} onClick={saveFinal}>SUBMIT FINAL PROMPT <span>→</span></button>}
        <div className="score-summary">TEAM SCORE <b>{score} PTS</b></div>
        <button className="text-btn" onClick={goLeaderboard}>See the leaderboard ↗</button>
      </main>}

      {mode === "leaderboard" && <main className="leader-layout">
        <div className="eyebrow">THE QUEST ARENA</div><h1>Team <em>leaderboard.</em></h1>
        <p className="hero-copy">Every point is a step towards more thoughtful AI use.</p>
        <div className="leader-card">
          <div className="leader-head"><span>RANK / TEAM</span><span>SCORE</span></div>
          {leaderboard.length ? leaderboard.map((t,i)=><div className="leader-row" key={t.id}><span><b className="rank">{String(i+1).padStart(2,"0")}</b>{t.team_name}</span><strong>{t.score} <small>PTS</small></strong></div>) : <p className="empty">No scores yet. Join the quest to get started.</p>}
        </div>
        <button className="primary-btn" onClick={()=>setMode("home")}>BACK TO HOME <span>→</span></button>
      </main>}

      <footer className="footer"><span>HUMANS FIRST. BETTER PROMPTS. BETTER LEARNING.</span><span>BUILT FOR TEACHERS ✦</span></footer>
    </div>
  );
}

export default App;