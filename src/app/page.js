"use client";
import { useState } from "react";
import { DS } from "./arboris/ds";
import { GlobalStyles } from "./arboris/shared";
import { TopNav } from "./arboris/nav";
import { AdminDashboard } from "./arboris/admin";
import { AddPersonForm } from "./arboris/form";
import { RelationshipEditor } from "./arboris/relationships";
import { TreeVisualization } from "./arboris/tree";

export default function App() {
  const [activeView, setActiveView] = useState("visualization");
  const [selectedPerson, setSelectedPerson] = useState(null);

  const views = {
    admin: <AdminDashboard setActiveView={setActiveView} setSelectedPerson={setSelectedPerson} />,
    addPerson: <AddPersonForm />,
    relationships: <RelationshipEditor />,
    visualization: <TreeVisualization selectedPerson={selectedPerson} setSelectedPerson={setSelectedPerson} />,
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: DS.colors.bg, color: DS.colors.text }}>
        <TopNav activeView={activeView} setActiveView={setActiveView} />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {views[activeView]}
        </div>
      </div>
    </>
  );
}