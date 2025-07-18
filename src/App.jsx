import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Torus, Cylinder } from '@react-three/drei';

// AR Animation Options
const AR_ANIMATIONS = {
  ROTATING_CUBE: 'rotating_cube',
  BOUNCING_SPHERE: 'bouncing_sphere',
  SPINNING_TORUS: 'spinning_torus',
  FLOATING_CYLINDER: 'floating_cylinder',
  PULSING_CUBE: 'pulsing_cube'
};

// 3D AR Component with Animation Options
const ARExperience = ({ animationType = AR_ANIMATIONS.ROTATING_CUBE }) => {
  const meshRef = useRef();
  const sphereRef = useRef();
  const torusRef = useRef();
  const cylinderRef = useRef();
  const pulseRef = useRef();
  
  useEffect(() => {
    if (!meshRef.current) return;

    const animate = () => {
      switch (animationType) {
        case AR_ANIMATIONS.ROTATING_CUBE:
          if (meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
          }
          break;
        case AR_ANIMATIONS.BOUNCING_SPHERE:
          if (sphereRef.current) {
            sphereRef.current.position.y = Math.sin(Date.now() * 0.003) * 0.5;
            sphereRef.current.rotation.x += 0.02;
          }
          break;
        case AR_ANIMATIONS.SPINNING_TORUS:
          if (torusRef.current) {
            torusRef.current.rotation.x += 0.02;
            torusRef.current.rotation.y += 0.01;
            torusRef.current.rotation.z += 0.015;
          }
          break;
        case AR_ANIMATIONS.FLOATING_CYLINDER:
          if (cylinderRef.current) {
            cylinderRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.3;
            cylinderRef.current.rotation.y += 0.03;
          }
          break;
        case AR_ANIMATIONS.PULSING_CUBE:
          if (pulseRef.current) {
            const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2;
            pulseRef.current.scale.set(scale, scale, scale);
            pulseRef.current.rotation.y += 0.01;
          }
          break;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }, [animationType]);

  const renderObject = () => {
    switch (animationType) {
      case AR_ANIMATIONS.ROTATING_CUBE:
        return (
          <Box ref={meshRef} args={[2, 2, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
        );
      case AR_ANIMATIONS.BOUNCING_SPHERE:
        return (
          <Sphere ref={sphereRef} args={[1, 32, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#ef4444" />
          </Sphere>
        );
      case AR_ANIMATIONS.SPINNING_TORUS:
        return (
          <Torus ref={torusRef} args={[1, 0.3, 16, 100]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#10b981" />
          </Torus>
        );
      case AR_ANIMATIONS.FLOATING_CYLINDER:
        return (
          <Cylinder ref={cylinderRef} args={[0.5, 0.5, 2, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#f59e0b" />
          </Cylinder>
        );
      case AR_ANIMATIONS.PULSING_CUBE:
        return (
          <Box ref={pulseRef} args={[1.5, 1.5, 1.5]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#8b5cf6" />
          </Box>
        );
      default:
        return (
          <Box ref={meshRef} args={[2, 2, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#3b82f6" />
          </Box>
        );
    }
  };

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {renderObject()}
      <Text
        position={[0, 3, 0]}
        fontSize={0.5}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
      >
        AR Experience
      </Text>
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
    </>
  );
};

const App = () => {
  const [isScanned, setIsScanned] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [campaignStats, setCampaignStats] = useState({
    totalScans: 0,
    uniqueUsers: 0,
    avgTimeSpent: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(AR_ANIMATIONS.ROTATING_CUBE);
  const [scanId, setScanId] = useState(null);

  // 📤 Handle Scan Click
  const handleScan = async () => {
    setIsLoading(true);
    setIsScanned(true);
    setScanCount(prev => prev + 1);

    // Start timer
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);

    // Send initial scan data to backend
    try {
      const response = await fetch("https://quleep-backend-uk2g.onrender.com/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeSpent: 0,
          location: "Delhi", // optional: use real geolocation
        }),
      });
      
      const data = await response.json();
      if (data.success && data.scan) {
        setScanId(data.scan.id);
      }
      
      // Fetch updated stats immediately
      await fetchCampaignStats();
    } catch (error) {
      console.error("Error recording scan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 Fetch campaign stats
  const fetchCampaignStats = async () => {
    try {
      const response = await fetch("https://quleep-backend-uk2g.onrender.com/api/scans/campaign");
      const data = await response.json();
      if (data.success) {
        setCampaignStats(data);
      }
    } catch (error) {
      console.error("Error fetching campaign stats:", error);
    }
  };

  // ⏱ Update time spent in real-time and sync with backend
  useEffect(() => {
    if (timerInterval && scanId && timeSpent > 0 && timeSpent % 5 === 0) {
      // Update time spent every 5 seconds
      fetch(`https://quleep-backend-uk2g.onrender.com/api/scan/${scanId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeSpent: timeSpent,
        }),
      }).then(() => {
        // Fetch updated stats after time update
        fetchCampaignStats();
      }).catch(error => {
        console.error("Error updating time spent:", error);
      });
    }
  }, [timeSpent, scanId, timerInterval]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Fetch stats when component mounts
  useEffect(() => {
    fetchCampaignStats();
  }, []);

  // Real-time stats update every 10 seconds
  useEffect(() => {
    const statsInterval = setInterval(() => {
      fetchCampaignStats();
    }, 10000);

    return () => clearInterval(statsInterval);
  }, []);

  // ⌛ Format time
  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // 🎨 Change AR Animation
  const changeAnimation = (animationType) => {
    setCurrentAnimation(animationType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 🚀 Header */}
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Experience Print Come to Life
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Scan the QR code to unlock an immersive augmented reality experience
          </p>
        </div>

        {/* 📊 Campaign Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-blue-600">{campaignStats.totalScans}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600">{campaignStats.uniqueUsers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Time Spent</p>
                <p className="text-2xl font-bold text-green-600">{campaignStats.avgTimeSpent}s</p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </div>
        </div>

        {/* 🎯 Main Content */}
        <div className="flex flex-col items-center space-y-8">
          {/* 📷 Scan Button */}
          {!isScanned && (
            <div className="text-center">
              <button
                onClick={handleScan}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-semibold px-12 py-4 rounded-full hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Scanning...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    📷 Scan QR Code
                  </span>
                )}
              </button>
              <p className="text-gray-500 mt-4 text-sm">
                Click to simulate QR code scanning
              </p>
            </div>
          )}

          {/* 🧠 AR Experience */}
          {isScanned && (
            <div className="w-full max-w-4xl">
              {/* 🎨 Animation Selector */}
              <div className="mb-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Choose AR Animation</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(AR_ANIMATIONS).map(([key, value]) => (
                    <button
                      key={value}
                      onClick={() => changeAnimation(value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentAnimation === value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                {/* AR Canvas */}
                <div className="w-full h-[500px] relative">
                  <Canvas camera={{ position: [0, 0, 5] }}>
                    <ARExperience animationType={currentAnimation} />
                  </Canvas>
                  
                  {/* 🛒 Buy Now Button */}
                  <button className="absolute bottom-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 z-10">
                    🛒 Buy Now
                  </button>
                  
                  {/* Session Timer */}
                  <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                    ⏱️ {formatTime(timeSpent)}
                  </div>
                </div>
              </div>
              
              {/* 📈 Session Analytics */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Session</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Session Time</p>
                    <p className="text-xl font-bold text-blue-600">{formatTime(timeSpent)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Scans Today</p>
                    <p className="text-xl font-bold text-purple-600">{scanCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;