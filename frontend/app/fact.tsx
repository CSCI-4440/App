import { useState, useEffect } from "react";

export default function useCatFact() {
  const [catFact, setCatFact] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the cat fact when the component mounts
    fetch("https://catfact.ninja/fact")
      .then((response) => response.json())
      .then((data) => {
        setCatFact(data.fact);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching the cat fact:", error);
        setLoading(false);
      });
  }, []);

  return { catFact, loading };
}