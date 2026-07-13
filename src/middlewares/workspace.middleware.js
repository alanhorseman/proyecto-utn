import ServerError from "../helpers/serverError.helper.js";
import workspaceRepository from "../repositories/workspace.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";


function workspaceMiddleware(valid_roles = []){
  return async function(req, res, next) {
    try {
      
      const user_id = req.user.id
      const workspace_id = req.params.workspace_id
  
      if (!workspace_id) {
        throw new ServerError('No se proporciono id del espacio de trabajo', 400)
      }
  
      const workspace = await workspaceRepository.getById(workspace_id)
      if (!workspace) {
        throw new ServerError('No se encontro el espacio de trabajo', 400)
      }
  
      const membership = await workspaceMemberRepository.getByUserAndWorkspaceId(user_id, workspace_id)
  
      if (!membership) {
        throw new ServerError('No eres miembro del espacio de trabajo', 403)
      }
      
      if(valid_roles.length > 0 && !valid_roles.includes(membership.rol)){
        throw new ServerError('No tenes el rol necesario', 403)
      }
      req.workspace = workspace
      req.membership = membership

      return next()
    } catch (error) {
      if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          status: error.status,
          message: error.message
        })
      } else {
        return res.status(500).json({
          ok: false,
          status: 500,
          message: "Internal Server Error"
        });
      }
    }
  }
}


export default workspaceMiddleware;