
import React, { useState, useRef } from 'react';
import { Task, PaymentRequest, PaymentStatus, PaymentProfile, PaymentMethod, TaskStatus, SubTask } from '../../types';
import { MapPin, Calendar, Clock, ChevronRight, X, Smartphone, CheckCircle, Camera, MapPinned, Loader2, Package, ArrowLeft, AlertTriangle, Landmark } from 'lucide-react';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  requests: PaymentRequest[];
  userId: string;
  setRequests: React.Dispatch<React.SetStateAction<PaymentRequest[]>>;
  profile: PaymentProfile;
}

export default function EmployeeTasks({ tasks, setTasks, requests, userId, setRequests, profile }: Props) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedSubTask, setSelectedSubTask] = useState<SubTask | null>(null);
  const [view, setView] = useState<'AVAILABLE' | 'MY_TASKS'>('AVAILABLE');
  
  // Completion Workflow States
  const [isCompleting, setIsCompleting] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [completionPhoto, setCompletionPhoto] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetCompletionFlow = () => {
    setIsCompleting(false);
    setLocationVerified(false);
    setIsGettingLocation(false);
    setCompletionPhoto(null);
    setSelectedSubTask(null);
  };

  const handleTakeTask = (task: Task) => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.IN_PROGRESS, assignedTo: userId } : t
    ));
    setSelectedTask(null);
  };

  const handleVerifyLocation = () => {
    setIsGettingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationVerified(true);
        setIsGettingLocation(false);
      },
      (error) => {
        alert("Please allow location access to mark task as done.");
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = (task: Task) => {
    if (!locationVerified || !completionPhoto) return;
    
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { 
        ...t, 
        status: TaskStatus.DONE, 
        completionPhoto: completionPhoto || undefined,
        completionLocationVerified: locationVerified,
        rejectionReason: undefined
      } : t
    ));
    setSelectedTask(null);
    resetCompletionFlow();
  };

  const availableTasks = tasks.filter(t => t.status === TaskStatus.OPEN);
  const myTasks = tasks.filter(t => t.assignedTo === userId && t.status !== TaskStatus.PAID);

  const displayTasks = view === 'AVAILABLE' ? availableTasks : myTasks;

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => { setView('AVAILABLE'); resetCompletionFlow(); }}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            view === 'AVAILABLE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}
        >
          Available ({availableTasks.length})
        </button>
        <button 
          onClick={() => { setView('MY_TASKS'); resetCompletionFlow(); }}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
            view === 'MY_TASKS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}
        >
          My Tasks ({myTasks.length})
        </button>
      </div>

      <div className="space-y-4">
        {displayTasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Clock size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No tasks found in this section.</p>
          </div>
        ) : (
          displayTasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => { setSelectedTask(task); resetCompletionFlow(); }}
              className={`p-5 bg-white border rounded-2xl shadow-sm active:scale-[0.98] cursor-pointer hover:border-indigo-100 transition-all ${
                task.rejectionReason ? 'border-red-100 bg-red-50/20' : 'border-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-lg font-semibold text-gray-900">₱{task.amount.toFixed(2)}</span>
                <div className="flex gap-2">
                  {task.isBatch && (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600">
                      Batch ({task.subTasks?.length})
                    </span>
                  )}
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                    task.status === TaskStatus.OPEN ? 'bg-green-50 text-green-600' : 
                    task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600' : 
                    task.status === TaskStatus.DONE ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-2 truncate">{task.title}</h3>
              
              {task.rejectionReason && (
                <div className="flex items-center gap-1.5 text-red-500 font-bold text-[9px] uppercase tracking-wider mb-4">
                  <AlertTriangle size={12} />
                  Correction Required
                </div>
              )}

              <div className="flex items-center justify-between text-indigo-600 font-semibold text-[11px] uppercase tracking-wider">
                <span>Tap for details</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Sheet Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 shadow-2xl relative animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
            
            <button 
              onClick={() => { setSelectedTask(null); resetCompletionFlow(); }} 
              className="absolute top-8 right-8 p-2 bg-gray-50 rounded-full text-gray-400 transition-colors hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            {selectedSubTask ? (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                <button 
                  onClick={() => setSelectedSubTask(null)}
                  className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-6"
                >
                  <ArrowLeft size={16} />
                  Back to Details
                </button>
                
                <div className="mb-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedSubTask.title}</h3>
                    <span className="text-xl font-bold text-indigo-600">₱{selectedSubTask.amount.toFixed(2)}</span>
                  </div>
                  <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Item Description</p>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedSubTask.description || "No specific instructions provided for this item."}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedSubTask(null)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                >
                  Got it
                </button>
              </div>
            ) : !isCompleting ? (
              <>
                {selectedTask.rejectionReason && (
                  <div className="mb-6 p-5 bg-red-50 border border-red-100 rounded-[1.5rem] animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="text-red-500" size={16} />
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Feedback from Admin</p>
                    </div>
                    <p className="text-sm font-semibold text-red-900 leading-relaxed italic">
                      "{selectedTask.rejectionReason}"
                    </p>
                    <p className="mt-3 text-[10px] text-red-400 font-bold uppercase tracking-tight">Please re-submit proof with corrections.</p>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedTask.isBatch && <Package className="text-indigo-600" size={20} />}
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedTask.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedTask.description}</p>
                </div>

                {selectedTask.isBatch && selectedTask.subTasks && (
                  <div className="mb-8 space-y-3">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-1">Included Items ({selectedTask.subTasks.length})</h4>
                    <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 divide-y divide-indigo-100 overflow-hidden">
                      {selectedTask.subTasks.map(sub => (
                        <div 
                          key={sub.id} 
                          onClick={() => setSelectedSubTask(sub)}
                          className="p-4 flex justify-between items-center bg-white/50 cursor-pointer hover:bg-white active:bg-indigo-50 transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-xs font-bold text-gray-900">{sub.title}</p>
                            <p className="text-[9px] text-indigo-500 font-bold uppercase mt-0.5">Tap to view details</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-indigo-600">₱{sub.amount.toFixed(2)}</p>
                            <ChevronRight size={14} className="text-indigo-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <MapPin size={16} className="text-orange-500 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{selectedTask.location}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <Calendar size={16} className="text-blue-500 mb-2" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{new Date(selectedTask.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Payout</p>
                      <p className="text-2xl font-bold text-indigo-900">₱{selectedTask.amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-end gap-1">
                        {selectedTask.paymentMethod === PaymentMethod.CASH ? <Landmark size={10} /> : <Smartphone size={10} />}
                        Payment via
                      </p>
                      <p className="text-xs font-semibold text-indigo-900">
                        {selectedTask.paymentMethod === PaymentMethod.CASH ? 'Cash' : 'GCash'}
                      </p>
                    </div>
                  </div>

                  {selectedTask.status === TaskStatus.OPEN && (
                    <button 
                      onClick={() => handleTakeTask(selectedTask)}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-indigo-100"
                    >
                      Take Task
                    </button>
                  )}

                  {selectedTask.status === TaskStatus.IN_PROGRESS && (
                    <button 
                      onClick={() => setIsCompleting(true)}
                      className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-green-100"
                    >
                      Mark as Done
                    </button>
                  )}

                  {selectedTask.status === TaskStatus.DONE && (
                    <div className="text-center p-6 bg-orange-50 rounded-2xl border border-orange-100">
                      <Clock size={32} className="mx-auto text-orange-400 mb-3" />
                      <p className="text-sm font-semibold text-orange-800">
                        Waiting for Admin Confirmation
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => { setSelectedTask(null); resetCompletionFlow(); }}
                    className="w-full py-2 text-sm font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Completion Proof</h3>
                  <p className="text-sm text-gray-500 font-medium">Please verify your work for this task</p>
                </div>

                <div className="space-y-6">
                  {/* Step 1: Location */}
                  <div className={`p-5 rounded-2xl border-2 transition-all ${locationVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${locationVerified ? 'bg-green-200 text-green-700' : 'bg-white text-gray-400'}`}>
                          <MapPinned size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">1. Verify Location</p>
                          <p className="text-[10px] text-gray-500 font-medium">{locationVerified ? 'Location Confirmed' : 'GPS access required'}</p>
                        </div>
                      </div>
                      {locationVerified && <CheckCircle size={20} className="text-green-600" />}
                    </div>
                    {!locationVerified && (
                      <button 
                        onClick={handleVerifyLocation}
                        disabled={isGettingLocation}
                        className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-indigo-600 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isGettingLocation ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
                        Confirm Location
                      </button>
                    )}
                  </div>

                  {/* Step 2: Photo */}
                  <div className={`p-5 rounded-2xl border-2 transition-all ${completionPhoto ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${completionPhoto ? 'bg-green-200 text-green-700' : 'bg-white text-gray-400'}`}>
                          <Camera size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">2. Proof of Work</p>
                          <p className="text-[10px] text-gray-500 font-medium">{completionPhoto ? 'Photo Attached' : 'Capture the result'}</p>
                        </div>
                      </div>
                      {completionPhoto && <CheckCircle size={20} className="text-green-600" />}
                    </div>
                    
                    {completionPhoto ? (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden shadow-inner border border-green-100">
                        <img src={completionPhoto} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setCompletionPhoto(null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full backdrop-blur-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-indigo-600 flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <Camera size={16} />
                        Take Photo
                      </button>
                    )}
                    <input 
                      type="file" 
                      ref={cameraInputRef} 
                      onChange={handlePhotoCapture} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment" 
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      disabled={!locationVerified || !completionPhoto}
                      onClick={() => handleFinalSubmit(selectedTask)}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-xl shadow-indigo-100 disabled:opacity-30 disabled:shadow-none"
                    >
                      Submit Task Completion
                    </button>
                    <button 
                      onClick={() => setIsCompleting(false)}
                      className="w-full py-2 text-sm font-bold text-gray-400 uppercase tracking-widest"
                    >
                      Back to Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
