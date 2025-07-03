export default function ProblemInput({ 
    problem, 
    setProblem, 
    code, 
    setCode, 
    onStartInterview, 
    interviewStarted, 
    error 
  }) {
    return (
      <div className="w-1/2 p-6 flex flex-col space-y-4 overflow-y-auto">
        <h1 className="text-3xl font-bold text-cyan-400">LeetCode AI Interviewer</h1>
        <p className="text-gray-400">Paste your problem and code below, then start the interview.</p>
        
        <div>
          <label htmlFor="problem" className="block text-sm font-medium text-gray-300 mb-2">
            Problem Description
          </label>
          <textarea
            id="problem"
            rows="10"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            placeholder="e.g., Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            disabled={interviewStarted}
          />
        </div>
        
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
            Your Code Solution
          </label>
          <textarea
            id="code"
            rows="15"
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
            placeholder="e.g., function twoSum(nums, target) { ... }"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={interviewStarted}
          />
        </div>
  
        {!interviewStarted && (
          <button
            onClick={onStartInterview}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Start Interview
          </button>
        )}
        
        {error && (
          <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>
    );
  }