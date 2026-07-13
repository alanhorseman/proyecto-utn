import mongoose from "mongoose";
import { WORKSPACE_COLLECTION_NAME } from "./workspace.model.js";
import { USER_COLLECTION_NAME } from "./user.model.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";

const WorkspaceMembersSchema = new mongoose.Schema({
  fk_workspace_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: WORKSPACE_COLLECTION_NAME
  },
  fk_user_id: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: USER_COLLECTION_NAME
  },
  fecha_creacion: {
    type: Date,
    required: true,
    default: Date.now
  },
  rol: {
    type: String,
    enum: [MEMBER_WORKSPACE_ROLES.ADMIN, MEMBER_WORKSPACE_ROLES.OWNER, MEMBER_WORKSPACE_ROLES.USER],
    default: MEMBER_WORKSPACE_ROLES.USER
  }
})

const WORKSPACE_MEMBER_MODEL_NAME = 'WorkspaceMember'
const WorkspaceMembers = mongoose.model(WORKSPACE_MEMBER_MODEL_NAME, WorkspaceMembersSchema)

export default WorkspaceMembers