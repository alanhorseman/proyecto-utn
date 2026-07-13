import Workspace from "../models/workspace.model.js";
import userRepository from "./user.repository.js";

class WorkspaceRepository {
  async create(nombre, descripcion){
    return await Workspace.create({nombre, descripcion})
  }
  async getAll(){
    return await Workspace.find({active: true});
  }
  async getById(workspace_id){
    return await Workspace.findById(workspace_id);
  }
  async deleteById(workspace_id){
    return await Workspace.findByIdAndUpdate(workspace_id, {active: false});
  }
  async updateById(workspace_id, update_data){
    return await Workspace.findByIdAndUpdate(workspace_id, update_data);
  }
}

const workspaceRepository = new WorkspaceRepository();
export default workspaceRepository;