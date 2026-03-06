'use client';

import { useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { motion } from 'framer-motion';

export default function FamilyTreeGraph({ refreshTrigger }) {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/graph');
        const data = await res.json();
        setElements(data.elements || []);
      } catch (error) {
        console.error('Failed to fetch graph data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const layout = {
    name: 'breadthfirst',
    directed: true,
    padding: 20,
    spacingFactor: 1.75,
    animate: true,
  };

  const style = [
    // Nodes
    {
      selector: 'node',
      style: {
        'label': 'data(label)',
        'text-valign': 'center',
        'color': '#1f2937', // zinc-800
        'font-size': '12px',
        'font-weight': 'bold',
        'border-width': 2,
        'border-color': '#fff',
      }
    },
    {
      selector: 'node[gender = "Male"]',
      style: {
        'shape': 'rectangle',
        'background-color': '#bfdbfe', // light blue
      }
    },
    {
      selector: 'node[gender = "Female"]',
      style: {
        'shape': 'ellipse',
        'background-color': '#fbcfe8', // light pink
      }
    },
    // Edges
    {
      selector: 'edge',
      style: {
        'width': 2,
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#9ca3af', // zinc-400
        'line-color': '#9ca3af',
        'label': 'data(type)',
        'font-size': '8px',
        'text-rotation': 'autorotate',
        'text-background-opacity': 1,
        'text-background-color': '#ffffff',
      }
    },
    {
      selector: 'edge[type = "MARRIED_TO"]',
      style: {
        'line-style': 'dashed',
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full h-96 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-inner relative"
    >
      {loading && (
         <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
         </div>
      )}
      
      <CytoscapeComponent
        elements={elements}
        layout={layout}
        stylesheet={style}
        className="w-full h-full"
        cy={(cy) => {
          cy.fit();
          // Optional: Add event listeners here
        }}
        wheelSensitivity={0.2}
      />
    </motion.div>
  );
}
