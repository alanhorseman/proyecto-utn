import express from 'express'
import workspaceController from '../controllers/workspace.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import workspaceMiddleware from '../middlewares/workspace.middleware.js';
import { MEMBER_WORKSPACE_ROLES } from '../constants/memberRoles.constant.js';

const workspaceRouter = express.Router()

// con esto, TODAS las rutas van a pasar por el authMiddleware
workspaceRouter.use(authMiddleware);
// de lo contrario se tendria que agregar en cada ruta asi: workspaceRouter.post('/', authMiddleware, workspaceController.create);

workspaceRouter.post('/', workspaceController.create);
workspaceRouter.get('/', workspaceController.getAllByUser);
workspaceRouter.put('/:workspace_id', workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER, MEMBER_WORKSPACE_ROLES.ADMIN]), workspaceController.updateById([MEMBER_WORKSPACE_ROLES.OWNER, MEMBER_WORKSPACE_ROLES.ADMIN]));
workspaceRouter.delete('/:workspace_id', workspaceMiddleware([MEMBER_WORKSPACE_ROLES.OWNER]), workspaceController.deleteById);


export default workspaceRouter;