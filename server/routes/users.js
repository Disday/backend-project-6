// @ts-check

import getUtils from '../../utilities/index.js';

export default (app) => {
  const { route, t, _, getModel, getQueryBuilder, isAuthorized } = getUtils(app);
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await getQueryBuilder('user');
      reply.render('users/index', { users });
    })
    .get('/users/new', { name: 'newUser' }, async (req, reply) => {
      const user = new (getModel('user'));
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', { name: 'editUser' }, (req, reply) => {
      const { user } = req;
      if (!isAuthorized(req)) {
        req.flash('error', t('flash.authError'));
        reply.redirect(route('root'));
      }
      reply.render('users/edit', { user });
      // return reply;
    })
    .post('/users', async (req, reply) => {
      const user = new (getModel('user'));
      const { data } = req.body;
      user.$set(data);
      try {
        const validUser = await getModel('user').fromJson(data);
        await getModel('user').query().insert(validUser);
        req.flash('info', t('flash.users.create.success'));
        reply.redirect(route('newSession'));
      } catch (e) {
        req.flash('error', t('flash.users.create.error'));
        reply.render('users/new', { user, errors: e.data });
      }

      return reply;
    })
    .patch('/users/:id', { name: 'user' }, async (req, reply) => {
      if (!isAuthorized(req)) {
        req.flash('error', t('flash.authError'));
        reply.redirect(route('root'));
      }
      const { data } = req.body;
      const { id } = req.params;
      const user = await getModel('user').query().findById(id); // refactor
      try {
        let validUser = await getModel('user').fromJson(data);
        if (data.password === '***') {
          validUser = _.omit(validUser, 'passwordDigest');
        }
        await user.$query().patch(validUser);
        req.flash('info', t('flash.users.update.success'));
        reply.render('users/edit', { user });
        // return reply;
      } catch (e) {
        req.flash('error', t('flash.users.update.error'));
        reply.render('users/edit', { user, errors: e.data });
      }
      return reply;
    })
    .delete('/users/:id', async (req, reply) => {
      if (!isAuthorized(req)) {
        req.flash('info', t('flash.authError'));
        reply.redirect(route('root'));
        return;
      }
      try {
        await getModel('user').query().findById(req.params.id).delete();
        req.logOut();
        req.flash('info', t('flash.users.delete.success'));
        reply.redirect(route('root'));
      } catch (e) {
        req.flash('error', t('flash.users.delete.error'));
        reply.redirect(route('users'));
      }
    });
};
