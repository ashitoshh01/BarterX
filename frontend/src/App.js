import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "sonner";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import Feed from "@/pages/Feed";
import Explore from "@/pages/Explore";
import ListingDetail from "@/pages/ListingDetail";
import CreateListing from "@/pages/CreateListing";
import AIMatches from "@/pages/AIMatches";
import Proposals from "@/pages/Proposals";
import Chat from "@/pages/Chat";
import ChatThread from "@/pages/ChatThread";
import SwapTracker from "@/pages/SwapTracker";
import Contracts from "@/pages/Contracts";
import Logistics from "@/pages/Logistics";
import Verification from "@/pages/Verification";
import Wallet from "@/pages/Wallet";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import Disputes from "@/pages/Disputes";
import ServiceSwap from "@/pages/ServiceSwap";
import AppLayout from "@/components/AppLayout";

const Shell = ({ children }) => <AppLayout>{children}</AppLayout>;

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              border: "3px solid #000",
              borderRadius: "12px",
              boxShadow: "4px 4px 0px 0px #000",
              background: "#fff",
              color: "#000",
              fontWeight: 700,
              fontFamily: "Outfit, sans-serif",
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/app/feed" element={<Shell><Feed /></Shell>} />
          <Route path="/app/explore" element={<Shell><Explore /></Shell>} />
          <Route path="/app/listing/:id" element={<Shell><ListingDetail /></Shell>} />
          <Route path="/app/create" element={<Shell><CreateListing /></Shell>} />
          <Route path="/app/edit/:id" element={<Shell><CreateListing /></Shell>} />
          <Route path="/app/matches" element={<Shell><AIMatches /></Shell>} />
          <Route path="/app/proposals" element={<Shell><Proposals /></Shell>} />
          <Route path="/app/chat" element={<Shell><Chat /></Shell>} />
          <Route path="/app/chat/:id" element={<Shell><ChatThread /></Shell>} />
          <Route path="/app/tracker/:id" element={<Shell><SwapTracker /></Shell>} />
          <Route path="/app/contracts" element={<Shell><Contracts /></Shell>} />
          <Route path="/app/logistics" element={<Shell><Logistics /></Shell>} />
          <Route path="/app/verification" element={<Shell><Verification /></Shell>} />
          <Route path="/app/wallet" element={<Shell><Wallet /></Shell>} />
          <Route path="/app/notifications" element={<Shell><Notifications /></Shell>} />
          <Route path="/app/profile" element={<Shell><Profile /></Shell>} />
          <Route path="/app/disputes" element={<Shell><Disputes /></Shell>} />
          <Route path="/app/service-swap" element={<Shell><ServiceSwap /></Shell>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
