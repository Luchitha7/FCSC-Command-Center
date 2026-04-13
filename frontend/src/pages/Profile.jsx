import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        console.error(error);
      } else {
        setProfiles(data);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <div>
      <h2>All Users</h2>

      {profiles.map((user) => (
        <div key={user.id}>
          <p>{user.email}</p>
          <p>{user.name}</p>
        </div>
      ))}
    </div>
  );
}