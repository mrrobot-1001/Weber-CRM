import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(255).required(),
});

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(50).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  roleId: Joi.number().integer().required(),
  departmentId: Joi.number().integer().optional(),
  managerId: Joi.number().integer().optional(),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  roleId: Joi.number().integer().optional(),
  departmentId: Joi.number().integer().optional(),
  managerId: Joi.number().integer().optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
});

export const createWorkAssignmentSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  assignedTo: Joi.number().integer().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  dueDate: Joi.date().optional(),
});

export const updateWorkAssignmentSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  dueDate: Joi.date().optional(),
});

export const createSubmissionSchema = Joi.object({
  assignmentId: Joi.number().integer().required(),
  submissionNotes: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
});

export const createEvaluationSchema = Joi.object({
  submissionId: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comments: Joi.string().optional(),
  feedback: Joi.object().optional(),
});

export const validateBody = async (schema: Joi.ObjectSchema, body: any) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message);
    throw new Error(JSON.stringify(messages));
  }

  return value;
};
