import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Sparkles, CreditCard, Clock, Edit, ShieldAlert, TrendingUp, MessageSquare, Send } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [profile, setProfile] = useState({
    score: 680,
    paymentHistory: 98,
    utilization: 45,
    historyLength: 5,
    newCredit: 2,
    creditMix: 2,
  });

  const [editProfile, setEditProfile] = useState(profile);

  const [history, setHistory] = useState([
    { month: 'Jan', score: 650 },
    { month: 'Feb', score: 655 },
    { month: 'Mar', score: 660 },
    { month: 'Apr', score: 658 },
    { month: 'May', score: 670 },
    { month: 'Jun', score: 680 },
  ]);

  const [aiInsights, setAiInsights] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [chatHistory, setChatHistory] = useState([
    { role: 'model', parts: [{ text: "Hi! I'm your Smart Credit AI Assistant. Ask me anything about credit scores, utilization, or how to improve your financial health!" }] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      setEditProfile(profile);
    }
  }, [isDialogOpen, profile]);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `
        You are an expert financial advisor. Analyze the following credit profile and provide 3 concise, actionable tips to improve the credit score.
        Current Score: ${profile.score}
        Payment History: ${profile.paymentHistory}% on time
        Credit Utilization: ${profile.utilization}%
        Length of Credit History: ${profile.historyLength} years
        Recent Inquiries: ${profile.newCredit}
        Credit Mix: ${profile.creditMix} types of credit
        
        Format the response as a short, encouraging paragraph followed by 3 bullet points. Keep it brief, personalized, and use Markdown for formatting.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiInsights(response.text || 'Unable to generate insights at this time.');
    } catch (error) {
      console.error(error);
      setAiInsights('An error occurred while fetching AI insights. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newUserMessage = { role: 'user', parts: [{ text: chatInput }] };
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: updatedHistory.map(msg => ({
          role: msg.role,
          parts: msg.parts
        })),
        config: {
          systemInstruction: "You are a specialized AI assistant for the Smart AI Credit Score Tracker app. You must ONLY answer questions and discuss topics related to credit scores, credit tracking, credit utilization, and financial health related to credit. If the user asks about ANY other topic (e.g., coding, weather, recipes, general knowledge), you must politely decline to answer and remind them that you are only here to help with credit-related questions. Be helpful, encouraging, and concise.",
        }
      });

      setChatHistory([
        ...updatedHistory,
        { role: 'model', parts: [{ text: response.text || "I'm sorry, I couldn't generate a response." }] }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory([
        ...updatedHistory,
        { role: 'model', parts: [{ text: "An error occurred while fetching the response. Please try again." }] }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveProfile = () => {
    const validScore = Math.min(850, Math.max(300, editProfile.score));
    const updatedProfile = { ...editProfile, score: validScore };
    
    setProfile(updatedProfile);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const nextMonth = months[history.length % 12];
    setHistory(prev => {
      const newHistory = [...prev, { month: nextMonth, score: validScore }];
      if (newHistory.length > 6) return newHistory.slice(1);
      return newHistory;
    });
    
    setAiInsights('');
    setIsDialogOpen(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-500';
    if (score >= 700) return 'text-blue-500';
    if (score >= 650) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreRating = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 700) return 'Good';
    if (score >= 650) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Smart AI Credit Score Tracker</h1>
            <p className="text-neutral-500 mt-1">AI-powered insights for your financial health</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button variant="outline" className="bg-white shadow-sm" />}>
              <Edit className="w-4 h-4 mr-2" /> Update Profile
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Update Your Credit Profile</DialogTitle>
                <DialogDescription>
                  Enter your latest credit information to track your progress and get updated AI insights.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Current Score</Label>
                  <Input 
                    type="number" 
                    min={300} max={850} 
                    value={editProfile.score} 
                    onChange={(e) => setEditProfile({...editProfile, score: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment History (%)</Label>
                  <Input 
                    type="number" 
                    min={0} max={100} 
                    value={editProfile.paymentHistory} 
                    onChange={(e) => setEditProfile({...editProfile, paymentHistory: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit Utilization (%)</Label>
                  <Input 
                    type="number" 
                    min={0} max={100} 
                    value={editProfile.utilization} 
                    onChange={(e) => setEditProfile({...editProfile, utilization: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit Age (Years)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={editProfile.historyLength} 
                    onChange={(e) => setEditProfile({...editProfile, historyLength: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recent Inquiries</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={editProfile.newCredit} 
                    onChange={(e) => setEditProfile({...editProfile, newCredit: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Credit Mix (Types)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    value={editProfile.creditMix} 
                    onChange={(e) => setEditProfile({...editProfile, creditMix: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="w-full mt-2">Save Profile</Button>
            </DialogContent>
          </Dialog>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Card */}
          <Card className="md:col-span-1 shadow-sm border-neutral-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Current Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <div className={`text-7xl font-light tracking-tighter ${getScoreColor(profile.score)}`}>
                {profile.score}
              </div>
              <Badge variant="secondary" className="mt-4 px-3 py-1 text-xs font-semibold uppercase tracking-widest bg-neutral-100 text-neutral-700">
                {getScoreRating(profile.score)}
              </Badge>
              <div className="w-full mt-8 space-y-2">
                <div className="flex justify-between text-xs font-medium text-neutral-400">
                  <span>300</span>
                  <span>850</span>
                </div>
                <Progress value={((profile.score - 300) / 550) * 100} className="h-2 bg-neutral-100" />
              </div>
            </CardContent>
          </Card>
          
          {/* History Chart */}
          <Card className="md:col-span-2 shadow-sm border-neutral-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Score History</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a3a3a3' }} dy={10} />
                  <YAxis domain={['dataMin - 20', 'dataMax + 20']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#a3a3a3' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                    itemStyle={{ color: '#171717', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Factors */}
          <Card className="md:col-span-2 shadow-sm border-neutral-200/60">
            <CardHeader>
              <CardTitle className="text-lg">Credit Factors</CardTitle>
              <CardDescription>Key elements impacting your score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FactorItem 
                icon={<Clock className="w-5 h-5 text-blue-500" />}
                title="Payment History"
                value={`${profile.paymentHistory}%`}
                status={profile.paymentHistory >= 99 ? 'Excellent' : profile.paymentHistory >= 97 ? 'Good' : 'Needs Work'}
                impact="High Impact"
              />
              <Separator className="bg-neutral-100" />
              <FactorItem 
                icon={<CreditCard className="w-5 h-5 text-purple-500" />}
                title="Credit Utilization"
                value={`${profile.utilization}%`}
                status={profile.utilization <= 10 ? 'Excellent' : profile.utilization <= 30 ? 'Good' : 'Needs Work'}
                impact="High Impact"
              />
              <Separator className="bg-neutral-100" />
              <FactorItem 
                icon={<Activity className="w-5 h-5 text-emerald-500" />}
                title="Credit Age"
                value={`${profile.historyLength} yrs`}
                status={profile.historyLength >= 7 ? 'Excellent' : profile.historyLength >= 4 ? 'Good' : 'Needs Work'}
                impact="Medium Impact"
              />
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="md:col-span-1 bg-neutral-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 p-4 opacity-5">
              <Sparkles className="w-48 h-48" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white text-lg">
                <Sparkles className="w-5 h-5 text-blue-400" />
                AI Insights
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Personalized advice based on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {aiInsights ? (
                <div className="flex flex-col h-full">
                  <div className="text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap flex-grow">
                    {aiInsights}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-6 w-full bg-white/10 border-white/20 hover:bg-white/20 text-white"
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Refresh Insights'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-sm text-neutral-400 px-2">
                    Get personalized tips to improve your credit score using Gemini AI.
                  </p>
                  <Button 
                    onClick={analyzeWithAI} 
                    disabled={isAnalyzing}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full mt-4"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Generate Insights'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Section */}
        <Card className="shadow-sm border-neutral-200/60 mt-6 flex flex-col h-[500px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Smart Credit Assistant
            </CardTitle>
            <CardDescription>Ask any questions about improving your credit score</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col px-6 pb-6 pt-0">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-100 text-neutral-800 rounded-bl-none'}`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-neutral-100 text-neutral-500 rounded-bl-none flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <Input
                placeholder="Ask about your credit score..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-neutral-50 border-neutral-200 focus-visible:ring-blue-500"
              />
              <Button onClick={handleSendMessage} disabled={isChatLoading || !chatInput.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FactorItem({ icon, title, value, status, impact }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-neutral-100 rounded-xl">
          {icon}
        </div>
        <div>
          <p className="font-medium text-neutral-900">{title}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{impact}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-neutral-900 text-lg">{value}</p>
        <p className={`text-xs font-medium mt-0.5 ${
          status === 'Excellent' ? 'text-emerald-600' : 
          status === 'Good' ? 'text-blue-600' : 'text-amber-600'
        }`}>{status}</p>
      </div>
    </div>
  );
}
