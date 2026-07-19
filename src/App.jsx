import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Truck, User, PlusCircle, ShieldAlert, Phone, Layers, Info, RefreshCw, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

// --- AUTHENTIC DISPATCH PREMIUM ICONS ---
const createCustomIcon = (url, size = [40, 40]) => new L.Icon({
  iconUrl: url,
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]]
});

const icons = {
  hub: createCustomIcon('https://cdn-icons-png.flaticon.com/512/2897/2897808.png', [38, 38]), 
  destination: createCustomIcon('https://cdn-icons-png.flaticon.com/512/3177/3177361.png', [38, 38]), 
  truckActive: createCustomIcon('https://cdn-icons-png.flaticon.com/512/754/754704.png', [44, 44]), 
  truckIdle: createCustomIcon('https://cdn-icons-png.flaticon.com/512/2769/2769336.png', [40, 40]), 
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

const defaultPickup = [28.6139, 77.2090];
const defaultDrop = [28.6560, 77.2500];

// --- COMPLETE 5-STEP TIMELINE WITH 'OUT FOR DELIVERY' & 'DELIVERED' ---
const TIMELINE_STEPS = [
  { title: "Order Confirmed", desc: "Item manifest verified at sorting base office." },
  { title: "Reached Pickup Point", desc: "Rider arrived at source location terminal." },
  { title: "Dispatched / In Transit", desc: "Consignment is moving over the high road network." },
  { title: "Out for Delivery", desc: "Parcel is nearby, rider is heading towards customer doorstep." },
  { title: "Item Delivered", desc: "Item successfully delivered and verification closed." }
];

function App() {
  // --- STATE REGISTRY ---
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [trackingType, setTrackingType] = useState("item");

  // Mandatory ERP Input Fields States
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formItem, setFormItem] = useState("");
  const [formInitialStep, setFormInitialStep] = useState("0");

  useEffect(() => {
    const socket = io('http://localhost:5000');
    return () => socket.disconnect();
  }, []);

  // --- SUBMIT REGISTRATION HANDLER ---
  const handleRegisterAsset = (e) => {
    e.preventDefault();
    if (!formName || !formMobile || !formVehicle || !formItem) {
      alert("Error: Validation Failed. Please fill out all fields!");
      return;
    }

    const initialStepIdx = parseInt(formInitialStep);
    const newAsset = {
      id: `FLEET-${Math.floor(10000 + Math.random() * 90000)}`,
      name: formName,
      mobile: formMobile,
      vehicle: formVehicle,
      currentItem: formItem,
      pickup: defaultPickup,
      drop: defaultDrop,
      currentStep: initialStepIdx,
      status: initialStepIdx === 4 ? "Delivered" : TIMELINE_STEPS[initialStepIdx].title,
      rating: (4.4 + Math.random() * 0.6).toFixed(1)
    };

    setDrivers([newAsset, ...drivers]);
    setSelectedDriverId(newAsset.id);

    // Form inputs reset
    setFormName("");
    setFormMobile("");
    setFormVehicle("");
    setFormItem("");
    setFormInitialStep("0");
  };

  // --- LIVE STATUS UPDATE HANDLER ---
  const handleUpdateStatus = (driverId, nextStepIndex) => {
    const stepIdx = parseInt(nextStepIndex);
    setDrivers(prevDrivers => 
      prevDrivers.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            currentStep: stepIdx,
            status: stepIdx === 4 ? "Delivered" : TIMELINE_STEPS[stepIdx].title
          };
        }
        return d;
      })
    );
  };

  const activeDriver = drivers.find(d => d.id === selectedDriverId);
  
  // Custom Map Location Interpolator based on 5 Steps
  const getLiveLocation = (driver) => {
    if (!driver) return defaultPickup;
    const { pickup, drop, currentStep } = driver;
    if (currentStep === 0) return pickup;
    if (currentStep === 1) return [pickup[0] + (drop[0] - pickup[0]) * 0.25, pickup[1] + (drop[1] - pickup[1]) * 0.25];
    if (currentStep === 2) return [pickup[0] + (drop[0] - pickup[0]) * 0.50, pickup[1] + (drop[1] - pickup[1]) * 0.50];
    if (currentStep === 3) return [pickup[0] + (drop[0] - pickup[0]) * 0.75, pickup[1] + (drop[1] - pickup[1]) * 0.75]; 
    return drop; 
  };

  const activeCoordinates = activeDriver ? getLiveLocation(activeDriver) : defaultPickup;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f0f4f8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Brand High Contrast Corporate Header (Updated to FLEET) */}
      <header style={{ background: 'linear-gradient(135deg, #0c2340 0%, #1d4ed8 100%)', color: 'white', padding: '16px 35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 4px 20px rgba(12, 35, 64, 0.25)', borderBottom: '3px solid #f97316' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px' }}>
          <Truck size={26} style={{ color: '#f97316' }} /> FLEET CONTROL CENTER
        </h1>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setTrackingType(trackingType === "partner" ? "item" : "partner")} 
            style={{ background: '#f97316', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={14} /> Tracking Node Mode: {trackingType.toUpperCase()}
          </button>
          <div style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
            🏢 Live Shipments Active: {drivers.length} Units
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', flex: 1, height: 'calc(100vh - 66px)' }}>
        
        {/* Left Side Console Dashboard Panel */}
        <div style={{ background: '#ffffff', padding: '20px', boxShadow: '5px 0 25px rgba(12,35,64,0.06)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto', borderRight: '1px solid #d1d5db' }}>
          
          {/* SECTION 1: REGISTRATION CONSOLE & LIVE STATUS CONTROL */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', color: '#0c2340', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
              <PlusCircle size={18} style={{ color: '#1d4ed8' }} /> Section 1: Dispatch Registration & Status Control
            </h3>
            
            <form onSubmit={handleRegisterAsset} style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <input type="text" placeholder="📦 Consignment Item ID (e.g. AMZN-7890-IN)" value={formItem} onChange={(e) => setFormItem(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #babcbe', fontSize: '12px' }} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input type="text" placeholder="👤 Rider Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #babcbe', fontSize: '12px' }} />
                <input type="text" placeholder="📞 Mobile No." value={formMobile} onChange={(e) => setFormMobile(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #babcbe', fontSize: '12px' }} />
              </div>

              <input type="text" placeholder="🚚 Vehicle Details & Plate (e.g. DL-1MA-5562)" value={formVehicle} onChange={(e) => setFormVehicle(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #babcbe', fontSize: '12px' }} />
              
              {/* LIVE UPDATE STATUS CONTROL MODULE */}
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Live Item Status & Update Controller:
                </span>
                
                {activeDriver ? (
                  <div>
                    <label style={{ fontSize: '10px', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                      Update Status for Current Item ({activeDriver.currentItem}):
                    </label>
                    <select 
                      value={activeDriver.currentStep} 
                      onChange={(e) => handleUpdateStatus(activeDriver.id, e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '2px solid #1d4ed8', fontSize: '12px', backgroundColor: '#ffffff', fontWeight: '700', color: '#0c2340', cursor: 'pointer' }}
                    >
                      {TIMELINE_STEPS.map((step, idx) => (
                        <option key={idx} value={idx}>
                          {idx === 3 ? "🛵 Update to: Out for Delivery" : idx === 4 ? "✅ Mark as DELIVERED" : `⚡ Update to: ${step.title}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '10px', color: '#475569', fontWeight: '600' }}>Set Initial Deployment Status:</label>
                    <select 
                      value={formInitialStep} 
                      onChange={(e) => setFormInitialStep(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', backgroundColor: 'white' }}
                    >
                      {TIMELINE_STEPS.map((step, idx) => (
                        <option key={idx} value={idx}>{idx === 4 ? "Delivered" : step.title}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" style={{ background: '#0c2340', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', marginTop: '2px' }}>
                Deploy Live Pipeline Track
              </button>
            </form>
          </div>

          {/* SECTION 2: LIVE TRACKING AND UPDATES (Updated text here) */}
          <div style={{ background: '#fdf2e9', border: '1px solid #fed7aa', padding: '16px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🛵 Section 2: Live Tracking and Updates
            </h3>

            {activeDriver ? (
              <div>
                {/* Meta Telemetry Card Info */}
                <div style={{ marginBottom: '14px', borderBottom: '1px dashed #fed7aa', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#0c2340' }}>
                      {trackingType === "item" ? `📦 Item: ${activeDriver.currentItem}` : `👤 Driver: ${activeDriver.name}`}
                    </div>
                    {activeDriver.currentStep === 3 && (
                      <span style={{ backgroundColor: '#f59e0b', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        🛵 OUT FOR DELIVERY
                      </span>
                    )}
                    {activeDriver.currentStep === 4 && (
                      <span style={{ backgroundColor: '#16a34a', color: 'white', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={12} /> DELIVERED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    <b>Carrier:</b> {activeDriver.name} | 📞 {activeDriver.mobile} <br />
                    <b>Fleet Model:</b> {activeDriver.vehicle}
                  </div>
                </div>

                {/* DELIVERED SUCCESS BANNER */}
                {activeDriver.currentStep === 4 && (
                  <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px', textAlign: 'center' }}>
                    🎉 Item Successfully Delivered to Customer Destination!
                  </div>
                )}

                {/* Timeline Steps Engine UI */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '10px' }}>
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isDone = activeDriver.currentStep >= idx;
                    const isCurrent = activeDriver.currentStep === idx;
                    
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', position: 'relative' }}>
                        {idx !== 4 && (
                          <div style={{ position: 'absolute', left: '10px', top: '22px', bottom: '-20px', width: '2px', backgroundColor: activeDriver.currentStep > idx ? '#16a34a' : '#cbd5e1', zIndex: 1 }} />
                        )}
                        
                        <div style={{ 
                          width: '22px', 
                          height: '22px', 
                          borderRadius: '50%', 
                          backgroundColor: idx === 4 && isDone ? '#16a34a' : isCurrent ? '#f97316' : isDone ? '#16a34a' : '#e2e8f0',
                          border: '2px solid white', 
                          boxShadow: '0 0 4px rgba(0,0,0,0.1)',
                          zIndex: 2, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {isDone ? '✓' : idx + 1}
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: idx === 4 && isDone ? '#16a34a' : isCurrent ? '#f97316' : isDone ? '#16a34a' : '#64748b' }}>
                            {step.title} {isCurrent && "⚡ (Live Now)"}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontSize: '11px', fontWeight: '600' }}>
                <ShieldAlert size={18} /> No dispatch active. Add parameters above to track.
              </div>
            )}
          </div>

          {/* SECTION 3: RECORDS GRID LEDGER */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#475569', fontWeight: '800', textTransform: 'uppercase' }}>📋 Section 3: Active Fleet Records ({drivers.length})</h4>
            {drivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '12px' }}>
                <Info size={24} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
                Ledger Database Empty.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {drivers.map((driver) => (
                  <div 
                    key={driver.id} 
                    onClick={() => setSelectedDriverId(driver.id)}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '10px', 
                      border: selectedDriverId === driver.id ? '2px solid #1d4ed8' : '1px solid #e2e8f0', 
                      backgroundColor: selectedDriverId === driver.id ? '#f0fdf4' : '#ffffff', 
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '9px', color: '#f97316', fontWeight: '700' }}>Manifest: {driver.id}</span>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0c2340', marginTop: '1px' }}>📦 Item: {driver.currentItem}</div>
                      </div>
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        fontWeight: '700', 
                        backgroundColor: driver.status === "Delivered" ? '#dcfce7' : driver.status === "Out for Delivery" ? '#fef3c7' : '#e0e7ff', 
                        color: driver.status === "Delivered" ? '#15803d' : driver.status === "Out for Delivery" ? '#d97706' : '#4338ca' 
                      }}>
                        {driver.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: OpenStreetMap Display */}
        <div style={{ height: '100%', width: '100%' }}>
          <MapContainer center={[28.6350, 77.2300]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            
            <Polyline positions={[defaultPickup, defaultDrop]} color="#1d4ed8" weight={4} opacity={0.4} dashArray="5, 10" />
            
            <Marker position={defaultPickup} icon={icons.hub}>
              <Popup><div style={{ fontSize: '11px' }}><b>🏢 Primary Sorting Facility</b></div></Popup>
            </Marker>

            <Marker position={defaultDrop} icon={icons.destination}>
              <Popup><div style={{ fontSize: '11px' }}><b>🏁 Client Fulfillment Destination</b></div></Popup>
            </Marker>

            {drivers.map((d) => {
              const livePos = getLiveLocation(d);
              return (
                <Marker 
                  key={d.id} 
                  position={livePos} 
                  icon={d.currentStep === 4 ? icons.truckIdle : icons.truckActive}
                >
                  <Popup>
                    <div style={{ fontSize: '12px', minWidth: '170px' }}>
                      <strong style={{ color: '#0c2340', fontSize: '13px', display: 'block', borderBottom: '1px solid #e2e8f0', paddingBottom: '3px', marginBottom: '4px' }}>Manifest: {d.id}</strong>
                      <span>📦 <b>Item:</b> {d.currentItem}</span><br />
                      <span>👤 <b>Courier Partner:</b> {d.name}</span><br />
                      <span style={{ color: d.status === "Delivered" ? '#16a34a' : d.status === "Out for Delivery" ? '#d97706' : '#f97316', fontWeight: 'bold' }}>📍 Status: {d.status}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {activeDriver && <RecenterMap center={activeCoordinates} />}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}

export default App;