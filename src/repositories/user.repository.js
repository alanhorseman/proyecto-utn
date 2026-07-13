import User from "../models/user.model.js";

class UserRepository {
  async getById(user_id) {
    return await User.findById(user_id)
  }

  async create(nombre, email, password) {
    return await User.create({ nombre, email, password })
  }

  async getByEmail(email){
    const user_found = await User.findOne({email: email});
    return user_found;
  }

  async deleteById(user_id){
    // await User.findByIdAndUpdate(user_id, {active: false})   \\ soft delete, actualiza un campo basicamente
    return await User.findByIdAndDelete(user_id) // elimina directamente
  }

  async updateById(user_id, update_data){
    return await User.findByIdAndUpdate(user_id, update_data)
  }
}

const userRepository = new UserRepository();
export default userRepository;