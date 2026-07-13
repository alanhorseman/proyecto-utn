import workspaceRepository from "../repositories/workspace.repository.js";
import workspaceMemberRepository from "../repositories/workspaceMember.repository.js";
import ServerError from "../helpers/serverError.helper.js";
import { MEMBER_WORKSPACE_ROLES } from "../constants/memberRoles.constant.js";

class WorkspaceController {
  async create(req, res){
    try {
      const { nombre, descripcion } = req.body;

      const user_id = req.user.id;

      if(!nombre || nombre.trim() === '') {
        throw new ServerError('El nombre del espacio de trabajo no puede estar vacio', 400)
      }

      const new_workspace = await workspaceRepository.create(nombre, descripcion || '')

      await workspaceMemberRepository.create(user_id, new_workspace._id, MEMBER_WORKSPACE_ROLES.OWNER)

      return res.status(201).json({
        ok: true,
        status: 201,
        message: 'Se creo el espacio de trabajo',
        data: {
          workspace: new_workspace
        }
      })

    } catch (error) {
      if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          message: error.message,
          status: error.status
        })
      }
      else {
        return res.status(500).json({
          ok: false,
          message: "Internal Server Error",
          status: 500
        });
      }
    }
  }

  async getAllByUser(req, res) {
    try {
      const user_id = req.user.id;
      const workspaces = await workspaceMemberRepository.getByUserId(user_id);

      return res.status(200).json({
        ok: true,
        status: 200,
        message: "Se completo solicitud",
        data: {
          workspaces
        }
      })
    } catch (error) {
      if (error instanceof ServerError) {
        return res.status(error.status).json({
          ok: false,
          message: error.message,
          status: error.status
        })
      }
      else {
        return res.status(500).json({
          ok: false,
          message: "Internal Server Error",
          status: 500
        });
      }
    }
  }

  updateById(valid_roles = []) {
    return async function (req, res){
      try {
        const workspace_id = req.params.workspace_id
        const membership = await workspaceMemberRepository.getByUserAndWorkspaceId(req.user.id, workspace_id)
        
        const { nombre, descripcion } = req.body
        
        const updated_workspace_data = {}
  
        if(!nombre && !descripcion){
          throw new ServerError('Debe completar al menos el nombre', 400)
        }
  
        if(nombre){
          if(nombre.length < 2){
            throw new ServerError('El nombre debe tener al menos 2 caracteres', 400)
          }
          updated_workspace_data.nombre = nombre
        }
  
        if(descripcion){
          updated_workspace_data.descripcion = descripcion
        }
  
        if(valid_roles.length > 0 && !valid_roles.includes(membership.rol)){
          console.log('valid roles', valid_roles);
          console.log('member rol', membership.rol);
          
          throw new ServerError('No tiene las credenciales validassss', 401)
        }
        
        const updated_workspace = await workspaceRepository.updateById(workspace_id, updated_workspace_data)
        const workspace_after_update = await workspaceRepository.getById(workspace_id)
  
        return res.status(200).json({
          ok: true,
          status: 200,
          data: {
            workspace_after_update
          }
        })
  
      } catch (error) {
        if (error instanceof ServerError) {
          return res.status(error.status).json({
            ok: false,
            message: error.message,
            status: error.status
          })
        }
        else {
          return res.status(500).json({
            ok: false,
            message: "Internal Server Error",
            status: 500
          });
        }
      }

    }
  }

  deleteById(valid_roles = []) {
    return async function(req, res){
      try {
        const workspace_id = req.params.workspace_id
        const membership = await workspaceMemberRepository.getByWorkspaceId(workspace_id)
        if(valid_roles.lentgh > 0 && !valid_roles.includes(membership.rol)){
          throw new ServerError('No tenes las credenciales validas', 401)
        }
        
        const delete_workspace = await workspaceRepository.deleteById(workspace_id)
  
        return res.status(200).json({
          ok: true,
          status: 200,
          message: 'Se elimino el espacio de trabajo'
        })
      } catch (error) {
        if (error instanceof ServerError) {
          return res.status(error.status).json({
            ok: false,
            message: error.message,
            status: error.status
          })
        }
        else {
          return res.status(500).json({
            ok: false,
            message: "Internal Server Error",
            status: 500
          });
        }
      }
    }
  }
}


const workspaceController = new WorkspaceController();
export default workspaceController;