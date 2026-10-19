import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Video from "@/models/Video";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    await connectDB();
    const admin = await User.findById(session.sub).select("role").lean();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
    }

    const firstCreator = await User.findOne({ role: "creator" })
      .sort({ createdAt: 1, _id: 1 })
      .select("_id name email subscription")
      .lean();

    if (!firstCreator) {
      return NextResponse.json({ error: "No creator account was found. No changes were made." }, { status: 404 });
    }

    const now = new Date();
    const videoCountBefore = await Video.countDocuments({});
    const videoUpdate = await Video.updateMany({}, { $set: { creator: firstCreator._id } });
    await User.updateOne(
      { _id: firstCreator._id, role: "creator" },
      { $set: { "subscription.status": "inactive", "subscription.expiresAt": now } }
    );

    const videoCountAfter = await Video.countDocuments({ creator: firstCreator._id });
    const creatorAfter = await User.findById(firstCreator._id).select("name email role subscription").lean();

    return NextResponse.json({
      success: true,
      message: "Existing videos assigned to the earliest registered creator; that creator's subscription is now inactive.",
      creator: {
        id: firstCreator._id.toString(),
        name: creatorAfter?.name || firstCreator.name,
        email: creatorAfter?.email || firstCreator.email,
        subscriptionStatus: creatorAfter?.subscription?.status || "inactive",
        expiresAt: creatorAfter?.subscription?.expiresAt || now
      },
      videoCountBefore,
      videosMatchedToCreatorAfter: videoCountAfter,
      videosModified: videoUpdate.modifiedCount
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not backfill videos and expire the first creator subscription.", detail: error.message }, { status: 500 });
  }
}
