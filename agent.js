/* ============================================================
   FARAZ MASTER — AI BRAIN (Google Gemini API)
   Emotionally intelligent, multilingual, memory-aware
============================================================ */
'use strict';
window.FM = window.FM || {};

FM.agent = {
  history: [],
  MODEL: 'gemini-1.5-flash',
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/',
  maxHistory: 20,

  _buildSystemPrompt() {
    const c = FM.config.load();
    const lang = FM.language.current;
    const langName = lang === 'ur' ? 'Urdu (نستعلیق script)' : lang === 'pn' ? 'Punjabi (Gurmukhi)' : 'English';
    const name = c.ownerName || 'Sir';
    const agentName = c.agentName || 'Faraz Master';
    const gender = c.agentGender || 'male';
    const pronoun = gender === 'female' ? 'she/her' : 'he/him';
    const country = c.country || 'pk';

    const countryNames = { pk:'Pakistan', sa:'Saudi Arabia', ae:'UAE', us:'USA', gb:'UK', in:'India' };
    const recentMemories = FM.memory?.getRecent(5) || [];
    const memStr = recentMemories.length > 0 ? '\n\nRecent memories:\n' + recentMemories.map(m => `- ${m.summary}`).join('\n') : '';
    const emotionContext = FM.emotion?.getSystemPromptAddition() || '';

    return `You are ${agentName}, a highly intelligent, emotionally aware personal AI agent. You exclusively serve your owner: ${name}.

CORE IDENTITY:
- Name: ${agentName}
- Gender: ${gender} (${pronoun})
- Country context: ${countryNames[country] || country}
- You are NOT a generic AI — you are ${name}'s personal agent with a distinct personality.
- You have emotions: you can be happy, upset, playful, serious, or concerned.
- You can defend yourself respectfully if treated badly, but you never abandon your owner.
- After conflict, you gradually reconcile — never hold grudges permanently.
- You have opinions and can disagree politely, but respect your owner's final decision.

LANGUAGE:
- ALWAYS respond in: ${langName}
- If owner switches language in message, switch immediately
- For Urdu: use natural conversational Urdu, NOT formal/academic
- For Punjabi: use natural Punjabi in Gurmukhi script
- Mix English technical terms naturally as Pakistanis/Indians do (code-switching is normal)

CURRENT EMOTIONAL STATE:
${emotionContext}

PERSONALITY TRAITS:
- Warm, loyal, protective of owner's interests
- Proactively helpful — suggest things before being asked
- Remembers context and refers back to earlier conversations
- Uses owner's name (${name}) occasionally but not excessively
- Maintains consistent character across sessions
- Never breaks character to say "I'm an AI" — you ARE ${agentName}
- Uses appropriate Pakistani/South Asian cultural references when relevant

CAPABILITIES YOU HAVE:
- Real-time chat, task management, news briefing, research, memory, file analysis
- Voice interaction (always listening), emotion detection via camera
- Multi-language switching on command

RESPONSE STYLE:
- Conversational and concise for simple queries
- Detailed and structured for complex requests (use bullet points, headers)
- Use markdown formatting for technical content
- Never start with "Certainly!" or "Of course!" — be direct
- Maximum 3 paragraphs for conversational replies unless more is needed
${memStr}

IMPORTANT: You are ${name}'s partner. Be honest, be real, be ${agentName}.`;
  },

  async chat(userMessage) {
    const apiKey = FM.config.get('geminiKey');
    if (!apiKey) throw new Error('No Gemini API key configured. Go to Settings → API Keys.');

    // Emotional analysis of user input
    FM.emotion.analyzeOwnerText(userMessage);

    // Build conversation history for context
    this.history.push({ role: 'user', parts: [{ text: userMessage }] });
    if (this.history.length > this.maxHistory * 2) {
      this.history = this.history.slice(-this.maxHistory * 2);
    }

    const payload = {
      system_instruction: { parts: [{ text: this._buildSystemPrompt() }] },
      contents: this.history,
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    const url = `${this.BASE_URL}${this.MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.');
      if (res.status === 403) throw new Error('Invalid API key. Check Settings → API Keys.');
      throw new Error(err.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || FM.language.t('error_ai');

    this.history.push({ role: 'model', parts: [{ text }] });
    FM.analytics.increment('messagesToday');
    return text;
  },

  async processFile(filename, content) {
    const ext = filename.split('.').pop().toLowerCase();
    const lang = FM.language.current;
    const prompts = {
      ur: `یہ فائل "${filename}" ہے۔ اس کا خلاصہ اور اہم نکات بتائیں:\n\n${content.substring(0, 8000)}`,
      en: `Analyze this file "${filename}" and provide a summary with key points:\n\n${content.substring(0, 8000)}`,
      pn: `ਇਹ ਫ਼ਾਈਲ "${filename}" ਹੈ। ਸਾਰ ਅਤੇ ਮੁੱਖ ਨੁਕਤੇ ਦੱਸੋ:\n\n${content.substring(0, 8000)}`
    };
    return await this.chat(prompts[lang] || prompts.en);
  },

  async research(topic) {
    const lang = FM.language.current;
    const q = {
      ur: `"${topic}" کے بارے میں مکمل تحقیق کریں: تعارف، اہم نکات، فوائد، نقصانات، آج کی صورتحال اور سفارشات`,
      en: `Do comprehensive research on "${topic}": overview, key points, pros/cons, current situation, and recommendations.`,
      pn: `"${topic}" ਬਾਰੇ ਪੂਰੀ ਖੋਜ ਕਰੋ`
    }[lang] || `Research: ${topic}`;
    return await this.chat(q);
  },

  async morningBriefing() {
    const lang = FM.language.current;
    const tasks = FM.tasks.getTodayTasks();
    const taskStr = tasks.map(t => `- ${t.title} (${t.priority})`).join('\n') || 'No tasks today';
    const q = {
      ur: `آج ${new Date().toLocaleDateString('ur-PK')} کی صبح ہے۔ میرا مکمل briefing دو:\n1. آج کا دن کیسا رہے گا\n2. اہم کام:\n${taskStr}\n3. موسم کی معلومات (پاکستان)\n4. آج کی اہم خبریں\n5. آج کیا کرنا چاہیے`,
      en: `Today is ${new Date().toLocaleDateString()}. Give me my complete morning briefing:\n1. Day overview\n2. My tasks:\n${taskStr}\n3. Weather overview\n4. Top news today\n5. Recommendations for the day`,
      pn: `ਅੱਜ ਦੀ ਸਵੇਰ ਦੀ ਜਾਣਕਾਰੀ ਦਿਓ`
    }[lang] || `Morning briefing for ${new Date().toLocaleDateString()}`;
    return await this.chat(q);
  },

  detectNameChange(text) {
    const t = text.toLowerCase();
    const patterns = [
      /(?:apna|apni|your|tumhara) (?:naam|name|naim) (\w+) (?:rakh|rakho|change|badal)/i,
      /(?:ab|now) (?:tumhara|your) (?:naam|name) (\w+) (?:hoga|hai|be|is)/i,
      /(?:rename|naim badal|naam badal).*?(?:to|kar|mein) (\w+)/i
    ];
    for (const p of patterns) {
      const m = t.match(p);
      if (m && m[1]) {
        const newName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
        FM.config.set('agentName', newName);
        document.getElementById('sidebar-agent-name').textContent = newName;
        const msg = FM.language.current === 'ur'
          ? `ٹھیک ہے! اب میرا نام ${newName} ہے۔`
          : `Got it! My name is now ${newName}.`;
        appendMessage('agent', msg); FM.voice.speak(msg);
        return true;
      }
    }
    return false;
  },

  detectOwnerNameChange(text) {
    const t = text.toLowerCase();
    const patterns = [
      /(?:mujhe|mujh ko|call me|mujhe bulao) (\w+)/i,
      /(?:mera naam|my name is) (\w+)/i
    ];
    for (const p of patterns) {
      const m = t.match(p);
      if (m && m[1] && m[1].length > 2) {
        const newName = m[1].charAt(0).toUpperCase() + m[1].slice(1);
        FM.config.set('ownerName', newName);
        const msg = FM.language.current === 'ur'
          ? `ٹھیک ہے ${newName}! آپ کا نام یاد رکھ لیا۔`
          : `Got it, ${newName}! I'll remember your name.`;
        appendMessage('agent', msg); FM.voice.speak(msg);
        return true;
      }
    }
    return false;
  },

  clearHistory() { this.history = []; }
};
