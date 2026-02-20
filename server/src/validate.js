function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validatePosts(payload) {
  if (!Array.isArray(payload)) {
    return { ok: false, message: 'posts payload must be an array' };
  }

  for (const item of payload) {
    if (!isObject(item)) return { ok: false, message: 'each post must be an object' };
    if (typeof item.id !== 'number') return { ok: false, message: 'post.id must be number' };
    if (typeof item.title !== 'string') return { ok: false, message: 'post.title must be string' };
    if (typeof item.excerpt !== 'string') return { ok: false, message: 'post.excerpt must be string' };
    if (typeof item.content !== 'string') return { ok: false, message: 'post.content must be string' };
    if (typeof item.category !== 'string') return { ok: false, message: 'post.category must be string' };
  }

  return { ok: true };
}

function validateProjects(payload) {
  if (!Array.isArray(payload)) {
    return { ok: false, message: 'projects payload must be an array' };
  }

  for (const item of payload) {
    if (!isObject(item)) return { ok: false, message: 'each project must be an object' };
    if (typeof item.title !== 'string') return { ok: false, message: 'project.title must be string' };
    if (typeof item.description !== 'string') return { ok: false, message: 'project.description must be string' };
    if (typeof item.category !== 'string') return { ok: false, message: 'project.category must be string' };
  }

  return { ok: true };
}

function validateTech(payload) {
  if (!Array.isArray(payload)) {
    return { ok: false, message: 'tech payload must be an array' };
  }

  for (const category of payload) {
    if (!isObject(category)) return { ok: false, message: 'each tech category must be an object' };
    if (typeof category.title !== 'string') return { ok: false, message: 'category.title must be string' };
    if (!Array.isArray(category.items)) return { ok: false, message: 'category.items must be array' };

    for (const item of category.items) {
      if (!isObject(item)) return { ok: false, message: 'each tech item must be object' };
      if (typeof item.label !== 'string') return { ok: false, message: 'tech item.label must be string' };
    }
  }

  return { ok: true };
}

module.exports = {
  validatePosts,
  validateProjects,
  validateTech
};
