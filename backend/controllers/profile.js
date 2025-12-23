import { getSupabaseClient } from "../clients/supabaseClient.js";
const supabase = getSupabaseClient();

export async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { first_name, last_name, avatar } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (avatar !== undefined) updateData.avatar = avatar;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid data to update" });
    }

    // Update the profile
    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      data,
    });

  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ error: err.message || "Failed to update profile" });
  }
}
