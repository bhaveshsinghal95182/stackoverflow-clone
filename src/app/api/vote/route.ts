import {
  answerCollection,
  db,
  questionCollection,
  voteCollection,
} from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";

export async function POST(request: NextRequest) {
  try {
    const { votedByID, VoteStatus, type, typeID } = await request.json();

    const response = await databases.listDocuments(db, voteCollection, [
      Query.equal("type", type),
      Query.equal("typeId", typeID),
      Query.equal("votedByID", votedByID),
    ]);

    if (response.documents.length > 0) {
      await databases.deleteDocument(
        db,
        voteCollection,
        response.documents[0].$id
      );

      // Decrease the reputation of the question/answer author
      const questionOrAnswer = await databases.getDocument(
        db,
        type === "question" ? questionCollection : answerCollection,
        typeID
      );

      const authorPrefs = await users.getPrefs<UserPrefs>(
        questionOrAnswer.authorId
      );

      await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
        reputation:
            response.documents[0].voteStatus === "upvoted"
            ? Number(authorPrefs.reputation) - 1
            : Number(authorPrefs.reputation) + 1,
      });
    }

    // that means prev vote does not exists or voteStatus changed
    if (response.documents[0]?.voteStatus !== VoteStatus) {
      const doc = await databases.createDocument(
        db,
        voteCollection,
        ID.unique(),
        {
          type,
          typeID,
          voteStatus: VoteStatus,
          votedByID,
        }
      );

      // Increate/Decrease the reputation of the question/answer author accordingly
      const questionOrAnswer = await databases.getDocument(
        db,
        type === "question" ? questionCollection : answerCollection,
        typeID
      );

      const authorPrefs = await users.getPrefs<UserPrefs>(
        questionOrAnswer.authorId
      );

      // if vote was present
      if (response.documents[0]) {
        await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
          reputation:
            // that means prev vote was "upvoted" and new value is "downvoted" so we have to decrease the reputation
            response.documents[0].voteStatus === "upvoted"
              ? Number(authorPrefs.reputation) - 1
              : Number(authorPrefs.reputation) + 1,
        });
      } else {
        await users.updatePrefs<UserPrefs>(questionOrAnswer.authorId, {
          reputation:
            // that means prev vote was "upvoted" and new value is "downvoted" so we have to decrease the reputation
            VoteStatus === "upvoted"
              ? Number(authorPrefs.reputation) + 1
              : Number(authorPrefs.reputation) - 1,
        });
      }

      const [upvotes, downvotes] = await Promise.all([
        databases.listDocuments(db, voteCollection, [
          Query.equal("type", type),
          Query.equal("typeId", typeID),
          Query.equal("voteStatus", "upvoted"),
          Query.equal("votedByID", votedByID),
          Query.limit(1), // for optimization as we only need total
        ]),
        databases.listDocuments(db, voteCollection, [
          Query.equal("type", type),
          Query.equal("typeId", typeID),
          Query.equal("voteStatus", "downvoted"),
          Query.equal("votedByID", votedByID),
          Query.limit(1), // for optimization as we only need total
        ]),
      ]);

      return NextResponse.json(
        {
          data: { document: doc, voteResult: upvotes.total - downvotes.total },
          message: response.documents[0] ? "Vote Status Updated" : "Voted",
        },
        {
          status: 201,
        }
      );
    }

    const [upvotes, downvotes] = await Promise.all([
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeID),
        Query.equal("voteStatus", "upvoted"),
        Query.equal("votedByID", votedByID),
        Query.limit(1), // for optimization as we only need total
      ]),
      databases.listDocuments(db, voteCollection, [
        Query.equal("type", type),
        Query.equal("typeId", typeID),
        Query.equal("voteStatus", "downvoted"),
        Query.equal("votedByID", votedByID),
        Query.limit(1), // for optimization as we only need total
      ]),
    ]);

    return NextResponse.json(
      {
        data: {
          document: null,
          voteResult: upvotes.total - downvotes.total,
        },
        message: "Vote Withdrawn",
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Error deleting vote" },
      { status: error?.status || error?.code || 500 }
    );
  }
}
