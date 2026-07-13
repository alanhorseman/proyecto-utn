import WorkspaceMembers from "../models/workspaceMembers.model.js"



class WorkspaceMemberRepository {

  async create(user_id, workspace_id, rol) {
    return await WorkspaceMembers.create({
      fk_workspace_id: workspace_id,
      fk_user_id: user_id,
      rol: rol
    })
  }

  async getByWorkspaceId(workspace_id) {
    const result = await WorkspaceMembers.find({ fk_workspace_id: workspace_id }).populate('fk_user_id')
    const members_mapped = result.map((member) => new MemberWorkspaceUserInfo(member))
    return members_mapped;
  }

  async getByUserId(user_id) {
    const memberships = await WorkspaceMembers
      .find({ fk_user_id: user_id })
      .populate({
        path: 'fk_workspace_id',
        select: 'nombre descripcion estado',
        match: { estado: true }
      })

    return memberships
      .filter(memb => membt.fk_workspace_id)
      .map(memb => ({
        member_id: memb._id,
        member_rol: memb.rol,
        member_fecha_union: memb.fecha_creacion,
        workspace_id: memb.fk_workspace_id,
        workspace_nombre: memb.fk_workspace_id.nombre,
        workspace_descripcion: memb.fk_workspace_id.descripcion
      }))
  }

  async getById(member_id) {
    return await WorkspaceMembers.findById(member_id)
  }

  async getByUserAndWorkspaceId(user_id, workspace_id) {
    const membership = await WorkspaceMembers.findOne({
      fk_user_id: user_id,
      fk_workspace_id: workspace_id
    })
    return membership;
  }

  async updateById(member_id, update_data) {
    return await WorkspaceMembers.findByIdAndUpdate(member_id, update_data)
  }

  async deleteById(member_id) {
    return await WorkspaceMembers.findByIdAndDelete(member_id)
  }
}

// move a otro lugar
class MemberWorkspaceUserInfo {
  constructor(member_data) {
    this.member_id = member_data._id,
      this.member_fk_workspace_id = member_data.fk_workspace_id,
      this.member_rol = member_data.rol,
      this.member_fecha_creacion = member_data.fecha_creacion,
      this.user_id = member_data.fk_user_id._id,
      this.user_nombre = member_data.fk_user_id.nombre,
      this.user_email = member_data.fk_user_id.email
  }
}

const workspaceMemberRepository = new WorkspaceMemberRepository()

export default workspaceMemberRepository;