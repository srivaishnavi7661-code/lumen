import React, { useState, useEffect, useRef } from 'react';
import { FileText, Users, Wand2, Copy, Check, Sparkles, Save, Mic, MicOff, LayoutTemplate, Mail, Share2, Target, ShieldCheck, BookOpen, GraduationCap, AlertTriangle, Lightbulb, Globe, Building2, MapPin, Banknote, Calendar, Search, Download, Plus, Clock, Archive, PenTool } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateAssets, researchCompany, analyzeJobMatch } from './services/geminiService';
import { AppState, CareerAssets, Tab, ChatMessage, Tone, JobMatchAnalysis, CompanyResearch, SavedSession } from './types';
import { Button } from './components/Button';
import { ChatBot } from './components/ChatBot';
import { HistoryModal } from './components/HistoryModal';

const TEMPLATES: Record<string, { label: string; text: string }> = {
  'cs-intern': {
    label: 'CS Internship',
    text: "Target Role: Software Engineering Intern\n\nSkills: Java, Python, React (Self-taught), Git.\nEducation: Junior at State University, CS Major, GPA 3.7.\nProjects: Built a Todo App in React, Python script to scrape weather data.\nInterests: AI, Web Development, Hackathons.\nGoal: Learning best practices, coding in a team environment."
  },
  'marketing-fresher': {
    label: 'Marketing Fresher',
    text: "Target Role: Social Media Marketing Assistant\n\nSkills: Canva, Instagram/TikTok trends, Basic Copywriting, Google Analytics certification.\nEducation: BA in Communications, recently graduated.\nExperience: Managed social media for college drama club (grew followers by 50%).\nPersonality: Creative, outgoing, data-curious."
  },
  'data-analyst': {
    label: 'Jr Data Analyst',
    text: "Target Role: Junior Data Analyst\n\nSkills: Excel (VLOOKUP, Pivot Tables), SQL (Basic), Tableau (Class project).\nEducation: BS in Statistics.\nProject: Analyzed public dataset of Spotify songs to find trends in popularity.\nCertifications: Google Data Analytics Professional Certificate."
  },
  'ux-design': {
    label: 'UX Design Intern',
    text: "Target Role: UX/UI Design Intern\n\nSkills: Figma, Adobe XD, Wireframing, User Research, Prototyping.\nEducation: Final year student in Interaction Design.\nPortfolio: Case study on redesigning a local food delivery app, focusing on accessibility.\nGoal: To work on real user problems and improve design system knowledge."
  },
  'project-manager': {
    label: 'Assoc. Project Manager',
    text: "Target Role: Associate Project Manager\n\nSkills: Agile/Scrum basics, Jira, Trello, Communication, Risk Management.\nEducation: MBA Fresher or Business Degree.\nExperience: Led the student council organizing committee for the annual tech fest (budget managed: $5k).\nStrengths: Leadership, detail-oriented, conflict resolution."
  },
  'recruiter': {
    label: 'Jr Recruiter / Coordinator',
    text: "Target Role: Recruiting Coordinator\n\nSkills: Scheduling, Email Communication, LinkedIn Networking, Basic HR knowledge.\nEducation: BA in Psychology or Human Resources.\nExperience: Internship at a non-profit handling volunteer recruitment.\nPersonality: People-person, organized, high empathy."
  },
  'sales-sdr': {
    label: 'Sales Dev Rep (SDR)',
    text: "Target Role: Sales Development Representative (SDR)\n\nSkills: Cold Calling, Email Outreach, CRM (HubSpot), Resilience, Active Listening.\nEducation: BA in any field.\nBackground: Part-time job in retail sales, consistently exceeded targets.\nMotivation: Money-motivated, competitive, wants a career in tech sales."
  },
  'general-intern': {
    label: 'General Business Intern',
    text: "Target Role: Business Operations Intern\n\nSkills: MS Office Suite, Organization, Research, Event Planning.\nEducation: Business Administration Sophomore.\nVolunteering: Organized campus charity run with 200 participants.\nStrengths: Communication, time management, eager to learn."
  }
};

const TONES: Tone[] = ['Professional', 'Enthusiastic', 'Academic', 'Creative', 'Confident'];

const HISTORY_KEY = 'career_launch_history_v1';
const CURRENT_SESSION_KEY = 'career_launch_current_session';

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  { role: 'model', content: "Hi! I'm your AI Career Coach. Tell me about your skills and the role you want, and I'll build your resume and prep kit!" }
];

function App() {
  // State
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // UI State
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');
  
  const [rawNotes, setRawNotes] = useState('');
  const [tone, setTone] = useState<Tone>('Professional');
  const [companyInput, setCompanyInput] = useState('');
  const [companyResearch, setCompanyResearch] = useState<CompanyResearch | null>(null);
  
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [assets, setAssets] = useState<CareerAssets | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.RESUME);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Job Match State
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [jobMatchAnalysis, setJobMatchAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES);
  
  // Speech recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const originalNotesRef = useRef<string>('');
  
  // Content Ref for PDF Generation
  const contentRef = useRef<HTMLDivElement>(null);

  // Load History on Mount
  useEffect(() => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    if (historyStr) {
      try {
        setSessions(JSON.parse(historyStr));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    // Try to load current session draft if exists
    const currentStr = localStorage.getItem(CURRENT_SESSION_KEY);
    if (currentStr) {
      try {
        const data = JSON.parse(currentStr);
        setRawNotes(data.rawNotes || '');
        setTone(data.tone || 'Professional');
        setCompanyInput(data.companyInput || '');
        setCompanyResearch(data.companyResearch || null);
        setAssets(data.assets || null);
        setAppState(data.appState || AppState.IDLE);
        setActiveTab(data.activeTab || Tab.RESUME);
        setChatMessages(data.chatMessages || DEFAULT_CHAT_MESSAGES);
        setTargetJobDescription(data.targetJobDescription || '');
        setJobMatchAnalysis(data.jobMatchAnalysis || null);
        
        // If there are assets, show output tab on mobile
        if (data.assets) {
          setMobileTab('output');
        }
      } catch (e) {
        console.error("Failed to load current session", e);
      }
    }
  }, []);

  // Auto-save CURRENT STATE to a "Draft" key (not history)
  useEffect(() => {
    const currentData = {
      rawNotes,
      tone,
      companyInput,
      companyResearch,
      assets,
      appState,
      activeTab,
      chatMessages,
      targetJobDescription,
      jobMatchAnalysis
    };
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(currentData));
  }, [rawNotes, tone, companyInput, companyResearch, assets, appState, activeTab, chatMessages, targetJobDescription, jobMatchAnalysis]);


  const handleSaveToHistory = () => {
    if (!rawNotes.trim() && !assets) {
      alert("Please enter some details or generate content before saving.");
      return;
    }

    // Generate a title
    let title = "Untitled Role";
    if (companyInput) {
      title = `${companyInput} Application`;
    } else {
      const match = rawNotes.match(/Target Role: (.*?)(\n|$)/);
      if (match) {
        title = match[1];
      } else {
        title = rawNotes.split('\n')[0].substring(0, 30) || "Untitled Role";
      }
    }

    const newSession: SavedSession = {
      id: Date.now().toString(),
      title,
      timestamp: Date.now(),
      lastModified: new Date().toLocaleDateString(),
      data: {
        rawNotes,
        tone,
        companyInput,
        companyResearch,
        assets,
        appState,
        chatMessages,
        targetJobDescription,
        jobMatchAnalysis,
        activeTab
      }
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedSessions));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLoadSession = (session: SavedSession) => {
    const { data } = session;
    setRawNotes(data.rawNotes);
    setTone(data.tone);
    setCompanyInput(data.companyInput);
    setCompanyResearch(data.companyResearch);
    setAssets(data.assets);
    setAppState(data.appState);
    setActiveTab(data.activeTab);
    setChatMessages(data.chatMessages);
    setTargetJobDescription(data.targetJobDescription);
    setJobMatchAnalysis(data.jobMatchAnalysis);
    setShowHistory(false);
    // Switch to output tab on mobile if data exists
    if (data.assets) {
      setMobileTab('output');
    } else {
      setMobileTab('input');
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleNewSession = () => {
    if (window.confirm("Start a new session? Current unsaved changes will be cleared (unless you saved to history).")) {
      setRawNotes('');
      setTone('Professional');
      setCompanyInput('');
      setCompanyResearch(null);
      setAssets(null);
      setAppState(AppState.IDLE);
      setActiveTab(Tab.RESUME);
      setChatMessages(DEFAULT_CHAT_MESSAGES);
      setTargetJobDescription('');
      setJobMatchAnalysis(null);
      setMobileTab('input');
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  };

  const handleGenerate = async () => {
    if (!rawNotes.trim()) return;
    
    setError(null);
    setCompanyResearch(null);
    
    // Switch to output view on mobile immediately to show loading state
    setMobileTab('output');
    
    try {
      let companyContext = '';

      // Step 1: Research Company (if input provided)
      if (companyInput.trim()) {
        setAppState(AppState.RESEARCHING);
        // Find role from first line of notes or default to 'Intern'
        const roleMatch = rawNotes.match(/Target Role: (.*?)(\n|$)/);
        const role = roleMatch ? roleMatch[1] : 'Entry Level / Intern';
        
        const research = await researchCompany(companyInput, role);
        setCompanyResearch(research);
        companyContext = `
          Company Input: ${companyInput}
          Culture: ${research.culture}
          Work Mode: ${research.workMode}
          Key Values: ${research.culture}
        `;
        // Switch to Company Intel tab if company data is found
        setActiveTab(Tab.COMPANY_INTEL);
      } else {
        setActiveTab(Tab.RESUME);
      }

      // Step 2: Generate Assets
      setAppState(AppState.GENERATING);
      const result = await generateAssets(rawNotes, tone, companyContext);
      setAssets(result);
      setAppState(AppState.COMPLETE);

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleJobMatch = async () => {
    if (!targetJobDescription.trim() || !assets?.resumeDraft) return;
    
    setIsAnalyzingMatch(true);
    try {
      // Use the generated resume as the profile source + raw notes for context
      const profileContext = `Resume:\n${assets.resumeDraft}\n\nAdditional Context from User:\n${rawNotes}`;
      const analysis = await analyzeJobMatch(profileContext, targetJobDescription);
      setJobMatchAnalysis(analysis);
    } catch (err) {
      console.error("Job match analysis failed", err);
      alert("Failed to analyze job match. Please try again.");
    } finally {
      setIsAnalyzingMatch(false);
    }
  };

  const getContentForTab = () => {
    if (!assets && activeTab !== Tab.COMPANY_INTEL) return "";
    
    switch (activeTab) {
      case Tab.RESUME: return assets?.resumeDraft || "";
      case Tab.COVER_LETTER: return assets?.coverLetter || "";
      case Tab.INTERVIEW_PREP: return assets?.interviewPrep || "";
      case Tab.LINKEDIN: return assets?.linkedinContent || "";
      case Tab.NETWORKING: return assets?.networkingMessages || "";
      case Tab.SKILL_GAP: return (assets?.skillGapAnalysis || "") + "\n\n---\n\n" + (assets?.atsOptimization || "");
      case Tab.JOB_MATCH: 
        if (!jobMatchAnalysis) return "";
        return `Match Score: ${jobMatchAnalysis.matchScore}/100\n\nSummary for Application: ${jobMatchAnalysis.tailoredSummary}`;
      case Tab.COMPANY_INTEL:
        if (!companyResearch) return "";
        return `Company: ${companyInput}\n\nCulture: ${companyResearch.culture}\n\nWork Mode: ${companyResearch.workMode}\n\nSalary: ${companyResearch.salary}\n\nAvailability: ${companyResearch.availability}`;
      default: return "";
    }
  };

  const handleCopy = (text?: string) => {
    const textToCopy = text || getContentForTab();
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    
    const content = contentRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${activeTab === Tab.RESUME ? 'Resume' : 'Document'} - CareerLaunch AI</title>
          <style>
            @page { margin: 20mm; }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              padding: 40px; 
              color: #1f2937; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; color: #111827; }
            h2 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; color: #374151; border-bottom: 1px solid #f3f4f6; padding-bottom: 4px; }
            h3 { font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: #4b5563; }
            ul { list-style-type: disc; margin-left: 20px; margin-bottom: 16px; }
            li { margin-bottom: 4px; }
            p { margin-bottom: 12px; }
            a { color: #4f46e5; text-decoration: none; }
            strong { font-weight: 600; color: #111827; }
            @media print {
              body { -webkit-print-color-adjust: exact; padding: 0; }
              a { text-decoration: none; color: #1f2937; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Allow styles to load
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      originalNotesRef.current = rawNotes;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        
        const prefix = originalNotesRef.current;
        const separator = prefix && !prefix.endsWith(' ') && !prefix.endsWith('\n') && transcript ? ' ' : '';
        setRawNotes(`${prefix}${separator}${transcript}`);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const chatContext = assets 
    ? `Resume:\n${assets.resumeDraft}\n\nCover Letter:\n${assets.coverLetter}\n\nInterview Q&A:\n${assets.interviewPrep}\n\nMissing Skills:\n${assets.skillGapAnalysis}`
    : `Student has provided these notes: ${rawNotes}`;

  const renderTabButton = (tab: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-shrink-0 px-4 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
    >
      {icon}
      {label}
      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <GraduationCap size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CareerLaunch AI</h1>
            <h1 className="text-xl font-bold text-gray-900 sm:hidden">CareerLaunch</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">New Session</span>
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Clock size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
            
            <button 
              onClick={handleSaveToHistory}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                saved 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save Session'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 overflow-hidden">
        
        {/* Mobile View Toggle */}
        {appState !== AppState.IDLE && (
          <div className="lg:hidden flex mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-1 shrink-0">
            <button
              onClick={() => setMobileTab('input')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${mobileTab === 'input' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <PenTool size={16} />
              Inputs
            </button>
            <button
              onClick={() => setMobileTab('output')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${mobileTab === 'output' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={16} />
              Results
            </button>
          </div>
        )}

        {/* Left Panel: Input */}
        <div className={`flex flex-col gap-6 transition-all duration-500 overflow-y-auto ${appState === AppState.COMPLETE ? 'lg:w-1/3' : 'lg:w-1/2 mx-auto'} ${mobileTab === 'output' && appState !== AppState.IDLE ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
            
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                Your Profile & Goals
              </h2>
              
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-medium transition-colors">
                  <LayoutTemplate size={14} />
                  Role Templates
                </button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-20">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase">Internship / Fresher</div>
                    {Object.entries(TEMPLATES).map(([key, tpl]) => (
                      <button 
                        key={key}
                        onClick={() => setRawNotes(tpl.text)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                         <Sparkles size={12} className="text-indigo-400" />
                         {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col min-h-[250px]">
              <div className="flex justify-end mb-2">
                 <button
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      isListening 
                        ? 'bg-red-50 text-red-600 animate-pulse' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isListening ? <><MicOff size={12} /> Listening...</> : <><Mic size={12} /> Dictate Profile</>}
                  </button>
              </div>
              <textarea 
                className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 leading-relaxed outline-none"
                placeholder="Paste your skills, coursework, projects, education, and the type of internship/job you are looking for..."
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
              />
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resume Tone</label>
                  <div className="relative">
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value as Tone)}
                      className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer hover:border-gray-300 transition-colors"
                    >
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                      <Sparkles size={14} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    Dream Company <span className="bg-gray-100 text-gray-400 px-1 rounded text-[10px]">Optional</span>
                  </label>
                  <div className="relative">
                     <input 
                      type="text"
                      placeholder="e.g. Google, https://stripe.com"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2.5 pl-9 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none hover:border-gray-300 transition-colors"
                     />
                     <div className="absolute left-3 top-3 text-gray-400">
                       <Globe size={14} />
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button 
                onClick={handleGenerate} 
                isLoading={appState === AppState.GENERATING || appState === AppState.RESEARCHING}
                disabled={!rawNotes.trim()}
                className="w-full py-3 text-lg"
              >
                {appState === AppState.RESEARCHING ? 'Researching Company...' : 
                 appState === AppState.GENERATING ? 'Building Career Kit...' : 'Generate Career Kit'}
                {appState === AppState.IDLE && <Wand2 size={20} />}
              </Button>
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Output */}
        {(appState === AppState.COMPLETE || appState === AppState.GENERATING || appState === AppState.RESEARCHING) && (
          <div className={`flex-1 flex flex-col animate-fade-in lg:w-2/3 h-full overflow-hidden ${mobileTab === 'input' ? 'hidden lg:flex' : 'flex'}`}>
             {appState === AppState.COMPLETE && assets ? (
               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
                 
                 {/* Scrollable Tabs */}
                 <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
                   {renderTabButton(Tab.RESUME, <FileText size={18} />, "Resume")}
                   {renderTabButton(Tab.COVER_LETTER, <Mail size={18} />, "Cover Letter")}
                   {renderTabButton(Tab.INTERVIEW_PREP, <Users size={18} />, "Interview Prep")}
                   {companyResearch && renderTabButton(Tab.COMPANY_INTEL, <Building2 size={18} />, "Company Intel")}
                   {renderTabButton(Tab.LINKEDIN, <Share2 size={18} />, "LinkedIn")}
                   {renderTabButton(Tab.NETWORKING, <Target size={18} />, "Networking")}
                   {renderTabButton(Tab.SKILL_GAP, <BookOpen size={18} />, "Skill Gap")}
                   {renderTabButton(Tab.JOB_MATCH, <ShieldCheck size={18} />, "Job Matcher")}
                 </div>

                 {/* Toolbar */}
                 <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                       {activeTab === Tab.RESUME ? 'ATS Optimized Draft' : 
                        activeTab === Tab.COVER_LETTER ? 'Tailored Application' :
                        activeTab === Tab.INTERVIEW_PREP ? 'Questions & Answers' :
                        activeTab === Tab.COMPANY_INTEL ? 'Dream Company Intel' :
                        activeTab === Tab.LINKEDIN ? 'Profile Optimization' :
                        activeTab === Tab.NETWORKING ? 'Outreach Templates' : 
                        activeTab === Tab.JOB_MATCH ? 'Rate My Fit' : 'Skills & Keywords'}
                     </span>
                     {companyInput && (activeTab === Tab.COVER_LETTER || activeTab === Tab.INTERVIEW_PREP) && (
                       <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                         <Building2 size={10} />
                         Tailored to {companyInput}
                       </span>
                     )}
                   </div>
                   
                   <div className="flex items-center gap-4">
                     {(activeTab !== Tab.COMPANY_INTEL && activeTab !== Tab.JOB_MATCH) && (
                       <button 
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                        title="Download as PDF"
                       >
                         <Download size={16} />
                         <span className="hidden sm:inline">PDF</span>
                       </button>
                     )}
                     <button 
                      onClick={() => handleCopy()}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                     >
                       {copied ? <Check size={16} /> : <Copy size={16} />}
                       {copied ? 'Copied!' : 'Copy'}
                     </button>
                   </div>
                 </div>

                 {/* Content Area */}
                 <div className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
                   {activeTab === Tab.COMPANY_INTEL ? (
                      <div className="p-6 h-full overflow-y-auto">
                        {companyResearch ? (
                          <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                              <h3 className="text-lg font-semibold text-indigo-900 mb-1">{companyInput}</h3>
                              <p className="text-sm text-indigo-700">AI-Powered Research for Students & Freshers</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-medium">
                                  <MapPin size={18} />
                                  Work Mode
                                </div>
                                <p className="text-gray-700 text-sm">{companyResearch.workMode}</p>
                              </div>
                              <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-green-600 font-medium">
                                  <Banknote size={18} />
                                  Fresher Salary Estimate
                                </div>
                                <p className="text-gray-700 text-sm">{companyResearch.salary}</p>
                              </div>
                            </div>
                            
                            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                               <div className="flex items-center gap-2 mb-2 text-orange-600 font-medium">
                                  <Calendar size={18} />
                                  Availability
                                </div>
                                <p className="text-gray-700 text-sm">{companyResearch.availability}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                               <div className="flex items-center gap-2 mb-2 text-purple-600 font-medium">
                                  <Building2 size={18} />
                                  Culture & Values
                                </div>
                                <div className="text-gray-700 text-sm markdown-body">
                                  <ReactMarkdown>{companyResearch.culture}</ReactMarkdown>
                                </div>
                            </div>

                            {companyResearch.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Sources</p>
                                <div className="flex flex-wrap gap-2">
                                  {companyResearch.sources.map((src, idx) => (
                                    <a key={idx} href={src} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline bg-indigo-50 px-2 py-1 rounded truncate max-w-[200px]">
                                      {new URL(src).hostname}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex-col items-center justify-center h-full text-gray-400 hidden">
                             <Search size={48} className="mb-4 opacity-20" />
                             <p>Researching company details...</p>
                          </div>
                        )}
                      </div>
                   ) : activeTab === Tab.JOB_MATCH ? (
                     <div className="p-6 h-full flex flex-col">
                       <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800">
                         <div className="flex items-center gap-2 font-semibold mb-1">
                           <ShieldCheck size={16} />
                           Will I get the interview?
                         </div>
                         Paste a real Job Description (JD) below. We'll compare your generated profile against it to see how well you match and what to fix.
                       </div>
                       
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                         {/* Input Side */}
                         <div className="flex flex-col h-full">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Paste Job Description</label>
                            <textarea
                              className="flex-1 w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm outline-none text-gray-900"
                              placeholder="Paste the full text of the job you want to apply to..."
                              value={targetJobDescription}
                              onChange={(e) => setTargetJobDescription(e.target.value)}
                            />
                            <Button 
                              onClick={handleJobMatch}
                              disabled={!targetJobDescription.trim()}
                              isLoading={isAnalyzingMatch}
                              className="mt-4 w-full"
                            >
                              Analyze Fit
                            </Button>
                         </div>

                         {/* Output Side */}
                         <div className="flex flex-col h-full overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
                           {jobMatchAnalysis ? (
                             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
                               {/* Score */}
                               <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                 <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${
                                   jobMatchAnalysis.matchScore >= 80 ? 'border-green-500 text-green-600' : 
                                   jobMatchAnalysis.matchScore >= 50 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'
                                 }`}>
                                   {jobMatchAnalysis.matchScore}
                                 </div>
                                 <div>
                                   <div className="font-semibold text-gray-900">Fit Score</div>
                                   <div className="text-xs text-gray-500">Probability of interview</div>
                                 </div>
                               </div>

                               {/* Tailored Summary */}
                               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group relative">
                                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Tailored Resume Summary</div>
                                  <p className="text-sm text-gray-700">{jobMatchAnalysis.tailoredSummary}</p>
                                  <button onClick={() => handleCopy(jobMatchAnalysis.tailoredSummary)} className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><Copy size={14} /></button>
                               </div>

                               {/* Missing Skills */}
                               {jobMatchAnalysis.missingSkills.length > 0 && (
                                 <div>
                                   <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Missing / Critical Skills</div>
                                   <div className="flex flex-wrap gap-2">
                                     {jobMatchAnalysis.missingSkills.map(kw => (
                                       <span key={kw} className="bg-white text-gray-600 border border-gray-200 px-2 py-1 rounded text-xs">{kw}</span>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {/* Improvements */}
                               <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Lightbulb size={12}/> Resume Fixes</div>
                                  <ul className="list-disc pl-4 text-sm text-gray-600 space-y-1">
                                    {jobMatchAnalysis.resumeImprovements.map((imp, i) => (
                                      <li key={i}>{imp}</li>
                                    ))}
                                  </ul>
                               </div>
                             </div>
                           ) : (
                             <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                               <Target size={48} className="mb-4 opacity-20" />
                               <p className="text-sm">Paste the Job Description to see how well you match.</p>
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   ) : (
                     <div className="p-8 markdown-body text-gray-800" ref={contentRef}>
                       <ReactMarkdown>
                         {activeTab === Tab.RESUME ? assets.resumeDraft : 
                          activeTab === Tab.COVER_LETTER ? assets.coverLetter :
                          activeTab === Tab.INTERVIEW_PREP ? assets.interviewPrep :
                          activeTab === Tab.LINKEDIN ? assets.linkedinContent :
                          activeTab === Tab.NETWORKING ? assets.networkingMessages :
                          assets.skillGapAnalysis + "\n\n---\n\n" + assets.atsOptimization}
                       </ReactMarkdown>
                     </div>
                   )}
                 </div>
               </div>
             ) : (
               <div className="flex-1 flex items-center justify-center bg-white/50 rounded-2xl border border-dashed border-gray-300">
                  <div className="text-center p-8">
                    <div className="inline-block p-4 rounded-full bg-indigo-50 mb-4 animate-pulse">
                      {appState === AppState.RESEARCHING ? (
                        <Globe className="text-indigo-400 animate-spin-slow" size={32} />
                      ) : (
                        <Wand2 className="text-indigo-400" size={32} />
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {appState === AppState.RESEARCHING ? 'Researching Company Culture...' : 'Your Career Kit is on the way...'}
                    </h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                      {appState === AppState.RESEARCHING 
                        ? "Analyzing the company website to tailor your cover letter and interview answers." 
                        : "Gemini is structuring your resume, writing your cover letter, and preparing interview questions."}
                    </p>
                  </div>
               </div>
             )}
          </div>
        )}

      </main>

      <ChatBot 
        contextData={chatContext} 
        messages={chatMessages}
        setMessages={setChatMessages}
      />

      {showHistory && (
        <HistoryModal 
          sessions={sessions}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

export default App;