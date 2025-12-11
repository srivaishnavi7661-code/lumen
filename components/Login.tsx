import React, { useState } from 'react';
import { Mail, Lock, Linkedin, Phone, Calendar, ArrowRight, UserPlus, LogIn, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';

interface LoginProps {
  onLogin: (data: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    linkedin: '',
    mobile: '',
    dob: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, validation and API calls would go here.
    // For sandbox, we pass the data up to the main App.
    onLogin({ ...formData, isSignUp });
  };

  const inputClasses = "w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-gray-900 placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white mb-3 backdrop-blur-sm">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">CareerLaunch</h1>
            <p className="text-indigo-100 text-sm">AI Career Assistant for Students</p>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {isSignUp ? 'Create your Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  className={inputClasses}
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 uppercase">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  className={`${inputClasses} pr-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-4 pt-2 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">LinkedIn Profile</label>
                  <div className="relative">
                    <input
                      type="url"
                      name="linkedin"
                      className={inputClasses}
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin}
                      onChange={handleChange}
                    />
                    <Linkedin className="absolute left-3 top-3 text-gray-400" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Mobile No.</label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="mobile"
                        className={inputClasses}
                        placeholder="+1 234..."
                        value={formData.mobile}
                        onChange={handleChange}
                      />
                      <Phone className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                    <div className="relative">
                      <input
                        type="date"
                        name="dob"
                        className={inputClasses}
                        value={formData.dob}
                        onChange={handleChange}
                      />
                      <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-6 py-3">
              {isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-4">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-all flex items-center justify-center gap-2 mx-auto"
            >
              {isSignUp ? (
                <>Already have an account? Sign In</>
              ) : (
                <>Don't have an account? Sign Up</>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-400">
        Powered by Gemini 3.0 Pro &bull; Private & Secure
      </div>
    </div>
  );
};