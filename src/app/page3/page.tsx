"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import "./wizard.css";

export default function BusinessSetupPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [addressMethod, setAddressMethod] = useState("manual");
  const [shopAddress, setShopAddress] = useState("");

  // Authenticate session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          if (isMounted) {
            router.push("/");
          }
          return;
        }

        const user = session.user;
        if (!ownerName && user) {
          // Check 'users' table first
          const { data: userData } = await supabase
            .from("users")
            .select("name")
            .eq("id", user.id)
            .maybeSingle();

          if (userData?.name) {
            setOwnerName(userData.name);
          } else if (user.user_metadata?.full_name) {
            setOwnerName(user.user_metadata.full_name);
          } else if (user.email) {
            const defaultName = user.email.split("@")[0];
            setOwnerName(defaultName);
          }
        }
      } catch (err) {
        console.error("Auth check error in wizard:", err);
        if (isMounted) {
          router.push("/");
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          router.push("/");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Input refs for focus validation
  const validateAndGoNext = () => {
    if (currentStep === 0) {
      if (!ownerName.trim()) {
        const input = document.getElementById("ownerName");
        if (input) input.focus();
        return;
      }
      setCurrentStep(1);
    } else if (currentStep === 1) {
      if (!shopName.trim()) {
        const input = document.getElementById("shopName");
        if (input) input.focus();
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!businessType) {
        const select = document.getElementById("businessType");
        if (select) select.focus();
        return;
      }
      setCurrentStep(3);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      const input = document.getElementById("ownerName");
      if (input) input.focus();
      setCurrentStep(0);
      return;
    }
    if (!shopName.trim()) {
      const input = document.getElementById("shopName");
      if (input) input.focus();
      setCurrentStep(1);
      return;
    }
    if (!businessType) {
      const select = document.getElementById("businessType");
      if (select) select.focus();
      setCurrentStep(2);
      return;
    }
    if (addressMethod === "manual" && !shopAddress.trim()) {
      const input = document.getElementById("shopAddress");
      if (input) input.focus();
      setCurrentStep(3);
      return;
    }

    setIsSaving(true);
    const finalLocation = addressMethod === "manual" ? shopAddress.trim() : "Google Maps Location";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // Save store data to Supabase 'stores' table
        const { error: storeError } = await supabase
          .from("stores")
          .insert({
            user_id: userId,
            owner_name: ownerName.trim(),
            shop_name: shopName.trim(),
            business_type: businessType,
            location: finalLocation,
          });

        if (storeError) {
          console.error("Error saving store to Supabase:", storeError);
        }
      }

      // Save to localStorage
      localStorage.setItem("ownerName", ownerName.trim());
      localStorage.setItem("shopName", shopName.trim());
      localStorage.setItem("businessType", businessType);
      localStorage.setItem("shopAddress", finalLocation);
      localStorage.setItem("addressMethod", addressMethod);

      // Redirect to dashboard page
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to complete setup:", err);
      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Enter key navigation across wizard steps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (e.target instanceof HTMLButtonElement) {
          return;
        }
        if (e.target instanceof HTMLTextAreaElement && e.shiftKey) {
          return;
        }
        e.preventDefault();
        if (currentStep < 3) {
          validateAndGoNext();
        } else if (currentStep === 3) {
          const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
          finishSetup(fakeEvent);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, ownerName, shopName, businessType, shopAddress, addressMethod, isSaving]);

  // Autofocus input on step change
  useEffect(() => {
    if (authLoading) return;
    const timer = setTimeout(() => {
      if (currentStep === 0) {
        document.getElementById("ownerName")?.focus();
      } else if (currentStep === 1) {
        document.getElementById("shopName")?.focus();
      } else if (currentStep === 2) {
        document.getElementById("businessType")?.focus();
      } else if (currentStep === 3 && addressMethod === "manual") {
        document.getElementById("shopAddress")?.focus();
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep, authLoading, addressMethod]);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#080c14",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: "0.95rem",
          letterSpacing: "0.05em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderTopColor: "#fa709a",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-page-wrapper">
      <div className="page-shell">
        <header className="topbar">
          <Link href="/home" className="logo">
            OBSIDIAN
          </Link>
        </header>

        <main className="hero">
          <section className="copy">
            <div className="eyebrow">Business setup</div>
            <h1>
              Set up
              <br />
              your business
            </h1>
            <div className="divider"></div>
            <p>
              Launch your store with a polished setup flow built for a smooth
              start and a memorable brand.
            </p>
            <div className="meta">
              <span>4 simple steps</span>
              <span>Premium setup</span>
            </div>
          </section>

          <section className="display">
            <div className="scene">
              <div className="bubble b1"></div>
              <div className="bubble b2"></div>
              <div className="bubble b3"></div>
              <div className="bubble b4"></div>
              <div className="ring r1"></div>
              <div className="ring r2"></div>

              <div className="slide-panel">
                {/* Step 1 */}
                <div className={`step-card ${currentStep === 0 ? "active" : ""}`}>
                  <div className="count">Step 01</div>
                  <h3>What's your name?</h3>
                  <div className="hint">We’ll personalize your dashboard.</div>
                  <div className="field">
                    <label htmlFor="ownerName">Full name</label>
                    <input
                      id="ownerName"
                      type="text"
                      placeholder="Enter your full name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn-back"
                      style={{ visibility: "hidden", pointerEvents: "none" }}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      Back
                    </button>
                    <button type="button" onClick={validateAndGoNext} className="btn-next next-btn">
                      Next
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`step-card ${currentStep === 1 ? "active" : ""}`}>
                  <div className="count">Step 02</div>
                  <h3>What is your shop name?</h3>
                  <div className="hint">This will appear in your account.</div>
                  <div className="field">
                    <label htmlFor="shopName">Shop name</label>
                    <input
                      id="shopName"
                      type="text"
                      placeholder="e.g. Bright Mart Store"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="actions">
                    <button type="button" onClick={goBack} className="btn-back">
                      Back
                    </button>
                    <button type="button" onClick={validateAndGoNext} className="btn-next next-btn">
                      Next
                    </button>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`step-card ${currentStep === 2 ? "active" : ""}`}>
                  <div className="count">Step 03</div>
                  <h3>What type of business?</h3>
                  <div className="hint">Choose the category that fits best.</div>
                  <div className="field">
                    <label htmlFor="businessType">Business type</label>
                    <select
                      id="businessType"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      required
                    >
                      <option value="">Select business type</option>
                      <option value="grocery">Grocery</option>
                      <option value="clothing">Clothing</option>
                      <option value="electronics">Electronics</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="beauty">Beauty</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={goBack} className="btn-back">
                      Back
                    </button>
                    <button type="button" onClick={validateAndGoNext} className="btn-next next-btn">
                      Next
                    </button>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`step-card ${currentStep === 3 ? "active" : ""}`}>
                  <div className="count">Step 04</div>
                  <h3>Where is your shop located?</h3>
                  <div className="hint" style={{ marginBottom: "8px" }}>Choose how you want to add your address.</div>
                  <div className="field">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="addressMethod"
                          value="manual"
                          checked={addressMethod === "manual"}
                          onChange={() => setAddressMethod("manual")}
                        />
                        Manual Entry
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="addressMethod"
                          value="map"
                          checked={addressMethod === "map"}
                          onChange={() => setAddressMethod("map")}
                        />
                        Google Maps
                      </label>
                    </div>
                    <div style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "8px 12px",
                      marginTop: "0px"
                    }}>
                      {addressMethod === "manual" ? (
                        <>
                          <label htmlFor="shopAddress" style={{ display: "block", marginBottom: "2px", fontSize: "0.7rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(17, 19, 20, 0.68)" }}>Shop Address</label>
                          <textarea
                            id="shopAddress"
                            placeholder="Enter your full shop address"
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            required
                            style={{
                              width: "100%",
                              padding: "0",
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#101010",
                              minHeight: "36px",
                              resize: "none",
                              outline: "none"
                            }}
                          />
                        </>
                      ) : (
                        <div style={{
                          padding: "6px",
                          textAlign: "center",
                          color: "#94a3b8",
                          fontSize: "0.85rem"
                        }}>
                          Google Maps integration will be added here later.
                        </div>
                      )}
                      <div className="actions" style={{ marginTop: "2px" }}>
                        <button type="button" onClick={goBack} className="btn-back" style={{ padding: "10px" }} disabled={isSaving}>
                          Back
                        </button>
                        <button type="button" onClick={finishSetup} className="btn-next" style={{ padding: "10px" }} disabled={isSaving}>
                          {isSaving ? "Saving..." : "Finish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
