var babel = function (config) {
    config = config || {};
    babel.superclass.constructor.call(this, config);
};
Ext.extend(babel, Ext.Component, {
    page: {}, window: {}, grid: {}, tree: {}, panel: {}, combo: {}, config: {}, util: {},
    getMenu: function (menus) {
        var _this = this;
        var actionButtons = Ext.getCmp('modx-action-buttons');
        if (actionButtons) {
            var menu = [], i = 0, j = 0;
            for (var ctx in menus) {
                if (ctx === this.config.context_key) {
                    continue;
                }
                if (typeof (menus[ctx]['resourceUrl']) !== 'undefined' &&
                    menus[ctx]['resourceUrl'] !== '' &&
                    menus[ctx]['resourceUrl'] !== '#') {
                    menu.push({
                        text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-globe"></i>' + menus[ctx]['displayText'],
                        menu: {
                            items: [{
                                text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-pencil-square-o"></i>' + _('babel.open') + ' <b>' + menus[ctx]['resourceTitle'] + ' (' + menus[ctx]['resourceId'] + ')</b>',
                                resourceUrl: menus[ctx]['resourceUrl'],
                                resourceId: menus[ctx]['resourceId'],
                                handler: function () {
                                    MODx.loadPage('resource/update', 'id=' + this.resourceId);
                                }
                            }, '-', {
                                text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-chain-broken"></i>' + _('babel.unlink') + ' <b>' + menus[ctx]['resourceTitle'] + ' (' + menus[ctx]['resourceId'] + ')</b>',
                                contextKey: ctx,
                                target: menus[ctx]['resourceId'],
                                handler: function () {
                                    _this.unlinkTranslation(this.contextKey, 0, this.target);
                                }
                            }]
                        }
                    });
                    i++;
                } else {
                    menu.push({
                        text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-globe"></i>' + menus[ctx]['displayText'],
                        handler: Ext.emptyFn,
                        menu: {
                            items: [{
                                text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-plus-circle"></i>' + _('babel.create_translation'),
                                contextKey: ctx,
                                handler: function () {
                                    _this.createTranslation(this.contextKey);
                                }
                            }, '-', {
                                text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-link"></i>' + _('babel.link_translation'),
                                contextKey: ctx,
                                handler: function () {
                                    _this.linkTranslation(this.contextKey);
                                }
                            }]
                        }
                    });
                    j++;
                }
            }
            if (i > 0) {
                menu.push('-');
                menu.push({
                    text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-chain-broken"></i>' + _('babel.unlink_all_translations'),
                    handler: function () {
                        _this.unlinkTranslation();
                    }
                });
            }
            if (j > 0) {
                menu.push('-');
                menu.push({
                    text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-plus-square"></i>' + _('babel.create_multiple_translations'),
                    contextKey: ctx,
                    target: menus[ctx]['resourceId'],
                    handler: function () {
                        _this.createTranslation();
                    }
                });
            }
            menu.push('-');
            menu.push({
                text: '<i class="x-menu-item-icon x-buttonmenu-babel-item-icon icon icon-lightbulb-o"></i>' + _('babel.about'),
                handler: function () {
                    _this.aboutWindow();
                },
            });
            // destroy existing button menu
            var buttonMenu = Ext.getCmp('babel-language-select');
            if (buttonMenu) {
                buttonMenu.destroy(); // @TODO Get the previous button position and use this for the new button
            }
            buttonMenu = new Ext.Button({
                id: 'babel-language-select',
                text: 'Select Language',
                menu: menu,
                listeners: {
                    render: {
                        fn: function (btn) {
                            btn.setText(menus[_this.config.context_key]['displayText']);
                        },
                        scope: this
                    },
                    mouseover: function (btn) {
                        btn.showMenu();
                    }
                }
            });
            actionButtons.insertButton(0, [buttonMenu]);
            actionButtons.doLayout();
        }
    },
    linkTranslation: function (ctx, id, grid) {
        var _this = this;
        id = id || MODx.request.id;
        var window = MODx.load({
            xtype: 'modx-window',
            title: _('babel.link_translation'),
            closeAction: 'close',
            url: _this.config.connectorUrl,
            baseParams: {
                action: 'mgr/resource/link',
                context: ctx,
                id: id
            },
            listeners: {
                success: {
                    fn: function (r) {
                        MODx.msg.status({
                            title: _('success'),
                            message: r.message || _('save_successful')
                        });
                        if (grid) {
                            grid.refresh();
                        } else {
                            _this.getMenu(r.a.result.object.menu);
                        }
                        _this.hideMask();
                    },
                    scope: this
                },
                failure: {
                    fn: _this.hideMask,
                    scope: this
                },
                beforeSubmit: {
                    fn: _this.loadMask,
                    scope: this
                }
            },
            fields: [{
                xtype: 'textfield',
                fieldLabel: _('context'),
                anchor: '100%',
                disabled: true,
                emptyText: ctx
            }, {
                xtype: 'modx-field-parent-change',
                fieldLabel: _('babel.select_tree_node'),
                id: '',
                name: 'target-combo',
                anchor: '100%',
                end: function (parent) {
                    var tree = Ext.getCmp('modx-resource-tree');
                    if (!tree) {
                        return;
                    }
                    parent.display = parent.display || parent.value;
                    if (parent.context !== ctx) {
                        return;
                    }
                    tree.removeListener('click', this.handleChangeParent, this);
                    tree.on('click', tree._handleClick, tree);
                    tree.disableHref = false;
                    window.fp.getForm().findField('target').setValue(parent.value);
                    window.fp.getForm().findField('page_id').setValue(null);
                    this.setValue(parent.display);
                    this.oldValue = false;
                },
                handleChangeParent: function (node, e) {
                    var tree = Ext.getCmp('modx-resource-tree');
                    if (!tree) {
                        return false;
                    }
                    tree.disableHref = true;
                    var id = node.id.split('_');
                    id = id[1];
                    if (id === this.config.currentid) {
                        MODx.msg.alert('', _('resource_err_own_parent'));
                        return false;
                    }
                    this.fireEvent('end', {
                        value: node.attributes.type !== 'modContext' ? id : node.attributes.pk,
                        display: Ext.util.Format.stripTags(node.text),
                        context: node.attributes.ctx
                    });
                    e.preventDefault();
                    e.stopEvent();
                    return true;
                }
            }, {
                xtype: 'modx-combo',
                fieldLabel: _('babel.target_pagetitle'),
                name: 'page_id',
                anchor: '100%',
                url: _this.config.connectorUrl,
                baseParams: {
                    action: 'mgr/resource/getlist',
                    context: ctx,
                    combo: true
                },
                displayField: 'pagetitle',
                valueField: 'id',
                fields: ['id', 'pagetitle'],
                editable: true,
                typeAhead: true,
                forceSelection: true,
                listeners: {
                    select: {
                        fn: function (combo, record) {
                            var val = combo.getValue();
                            if (val === '' || val === 0 || val === '&nbsp;') {
                                combo.setValue(null);
                            } else {
                                window.fp.getForm().findField('target').setValue(record.get('id'));
                            }
                            window.fp.getForm().findField('target-combo').reset();
                        },
                        scope: this
                    },
                    blur: {
                        fn: function (combo) {
                            var val = combo.getValue();
                            if (val === '' || val === 0 || val === '&nbsp;') {
                                combo.setValue(null);
                            }
                        },
                        scope: this
                    }
                }
            }, {
                fieldLabel: _('babel.target_id'),
                xtype: 'numberfield',
                name: 'target',
                anchor: '100%',
                enableKeyEvents: true,
                listeners: {
                    keyup: {
                        fn: function () {
                            window.fp.getForm().findField('target-combo').reset();
                            window.fp.getForm().findField('page_id').reset();
                        },
                        scope: this
                    }
                }
            }, {
                xtype: 'xcheckbox',
                hideLabel: true,
                boxLabel: _('babel.copy_tv_values'),
                name: 'copy'
            }, {
                xtype: 'xcheckbox',
                hideLabel: true,
                boxLabel: _('babel.sync_linked_tranlations_target'),
                name: 'sync',
                checked: true
            }]
        });
        window.show();
    },
    unlinkTranslation: function (ctx, id, target, grid) {
        ctx = ctx || '';
        target = parseInt(target) || 0;
        id = id || MODx.request.id;
        var _this = this;
        var text = (target === 0) ?
            _('babel.unlink_all_translations_confirm') :
            _('babel.unlink_translation_confirm', {
                context: ctx,
                id: id
            });
        _this.loadMask();
        return MODx.msg.confirm({
            title: _('confirm'),
            text: text,
            url: this.config.connectorUrl,
            params: {
                action: 'mgr/resource/unlink',
                id: id,
                context: ctx,
                target: target
            },
            listeners: {
                success: {
                    fn: function (r) {
                        MODx.msg.status({
                            title: _('success'),
                            message: r.message || _('save_successful')
                        });
                        if (grid) {
                            grid.refresh();
                        } else {
                            _this.getMenu(r.object.menu);
                        }
                        _this.hideMask();
                    },
                    scope: this
                },
                failure: {
                    fn: _this.hideMask,
                    scope: this
                },
                cancel: {
                    fn: _this.hideMask,
                    scope: this
                }
            }
        });
    },
    createTranslation: function (ctx, id = 0) {
        var _this = this;
        id = id || MODx.request.id;
        this.loadMask();
        if (ctx) {
            var window = MODx.load({
                xtype: 'modx-window',
                title: _('babel.create_translation'),
                closeAction: 'close',
                buttons: [{
                    text: _('close'),
                    handler: function () {
                        window.close();
                    },
                    scope: this,
                }, {
                    text: _('create'),
                    cls: 'primary-button',
                    handler: function () {
                        var form = window.fp.getForm();
                        var values = form.getValues();
                        MODx.Ajax.request({
                            url: this.config.connectorUrl,
                            params: {
                                action: 'mgr/resource/duplicate',
                                context_key: ctx,
                                id: id,
                                copy: values.copy,
                                sync: values.sync,
                            },
                            listeners: {
                                success: {
                                    fn: function (r) {
                                        _this.hideMask();
                                        MODx.loadPage('resource/update', 'id=' + r.object.id);
                                    },
                                    scope: this
                                }
                            }
                        });
                    },
                    scope: this,
                }],
                listeners: {
                    beforeSubmit: {
                        fn: _this.loadMask,
                        scope: this
                    },
                    close: {
                        fn: _this.hideMask,
                        scope: this
                    },
                },
                fields: [{
                    style: 'padding-top: 15px',
                    html: '<p>' + _('babel.create_translation_confirm', {context: ctx, id: id}) + '</p>'
                }, {
                    xtype: 'xcheckbox',
                    hideLabel: true,
                    boxLabel: _('babel.sync_linked_tranlations'),
                    name: 'sync',
                    checked: true
                }]
            });
            window.show();
        } else {
            if (Babel.config.hasOwnProperty('menu') && Babel.config.hasOwnProperty('context_key')) {
                _this.babelMenu = Babel.config.menu;
                _this.babelContext = Babel.config.context_key;
                _this.createTranslations(ctx, id);
            } else {
                MODx.Ajax.request({
                    url: _this.config.connectorUrl,
                    params: {
                        action: 'mgr/resource/getmenu',
                        id: id,
                    },
                    listeners: {
                        success: {
                            fn: function (r) {
                                if (r.object.menu && r.object.context_key) {
                                    _this.babelMenu = r.object.menu;
                                    _this.babelContext = r.object.context_key;
                                    _this.createTranslations(ctx, id);
                                }
                            },
                            scope: this
                        }
                    }
                });
            }
        }
    },
    createTranslations: function (ctx, id) {
        var _this = this;
        var checkboxes = [];
        Ext.each(Babel.config.contexts, function (ctx) {
            if (ctx !== _this.babelContext &&
                _this.babelMenu.hasOwnProperty(ctx) &&
                (_this.babelMenu[ctx]['resourceUrl'] === 'undefined' ||
                    _this.babelMenu[ctx]['resourceUrl'] === '' ||
                    _this.babelMenu[ctx]['resourceUrl'] === '#')) {
                checkboxes.push({
                    boxLabel: _this.babelMenu[ctx]['displayText'],
                    name: 'contexts',
                    inputValue: ctx
                });
            }
        });
        if (checkboxes.length) {
            var window = MODx.load({
                xtype: 'modx-window',
                title: _('babel.create_multiple_translations'),
                closeAction: 'close',
                buttons: [{
                    text: _('close'),
                    handler: function () {
                        window.close();
                    },
                    scope: this,
                }, {
                    text: _('create'),
                    cls: 'primary-button',
                    handler: function () {
                        var form = window.fp.getForm();
                        var values = form.getValues();
                        window.close();
                        _this.addTranslation(id, values);
                    },
                    scope: this,
                }],
                listeners: {
                    beforeSubmit: {
                        fn: _this.loadMask,
                        scope: this
                    },
                    close: {
                        fn: _this.hideMask,
                        scope: this
                    },
                    afterrender: function () {
                        var checkAll = Ext.getCmp('babel-all-contexts');
                        if (checkAll) {
                            checkAll.setValue(1);
                        }
                    }
                },
                fields: [{
                    xtype: 'fieldset',
                    cls: 'x-fieldset-check-all',
                    title: _('babel.contexts'),
                    defaults: {
                        hideLabel: true,
                    },
                    items: [{
                        xtype: 'xcheckbox',
                        id: 'babel-all-contexts',
                        boxLabel: _('babel.all'),
                        itemCls: 'x-form-item-check-all',
                        submitValue: false,
                        listeners: {
                            check: {
                                fn: function (el) {
                                    var value = [];
                                    var babelContexts = Ext.getCmp('babel-contexts');
                                    Ext.each(Babel.config.contexts, function (ctx) {
                                        if (ctx !== _this.babelContext &&
                                            _this.babelMenu.hasOwnProperty(ctx)
                                        ) {
                                            value.push(el.getValue());
                                        }
                                    });
                                    babelContexts.setValue(value);
                                },
                                scope: this
                            }
                        }
                    }, {
                        xtype: 'checkboxgroup',
                        id: 'babel-contexts',
                        columns: 3,
                        anchor: '100%',
                        style: 'margin-top: -10px',
                        items: checkboxes
                    }]
                }, {
                    xtype: 'xcheckbox',
                    hideLabel: true,
                    boxLabel: _('babel.copy_tv_values'),
                    name: 'copy'
                }, {
                    xtype: 'xcheckbox',
                    hideLabel: true,
                    boxLabel: _('babel.sync_linked_tranlations'),
                    name: 'sync',
                    checked: true
                }]
            });
            window.show();
        } else {
            MODx.msg.alert('', _('babel.create_multiple_translations_err_no_contexts'));
            _this.hideMask();
        }
    },
    addTranslation: function (id, values) {
        var _this = this;

        this.contexts = (values.hasOwnProperty('contexts')) ? (Array.isArray(values.contexts) ? values.contexts : [values.contexts]) : [];
        delete values.contexts;

        var topic = '/babelduplicate/';
        this.console = MODx.load({
            xtype: 'modx-console',
            register: 'mgr',
            topic: topic,
            show_filename: false,
            clear: true,
            listeners: {
                complete: {
                    fn: function () {
                        var id = MODx.request.id;
                        MODx.msg.status({
                            title: _('success'),
                            message: _('babel.create_multiple_translations_finished')
                        });
                        MODx.Ajax.request({
                            url: _this.config.connectorUrl,
                            params: {
                                action: 'mgr/resource/getmenu',
                                id: id,
                            },
                            listeners: {
                                success: {
                                    fn: function (r) {
                                        _this.hideMask();
                                        if (r.object.menu) {
                                            _this.getMenu(r.object.menu)
                                        }
                                        if (MODx.request.a === 'resource/update') {
                                            MODx.loadPage('resource/update', 'id=' + MODx.request.id);
                                        }
                                    },
                                    scope: this
                                }
                            }
                        });
                        var resourceTree = Ext.getCmp('modx-resource-tree');
                        if (resourceTree && resourceTree.rendered) {
                            resourceTree.refresh();
                        }
                        _this.hideMask();
                    },
                    scope: this
                }
            }
        });
        this.console.show(Ext.getBody());

        _this.requestTranslation(0, topic, id, values);
    },
    requestTranslation: function (idx, topic, id, values) {
        var _this = this;
        MODx.Ajax.request({
            url: this.config.connectorUrl,
            params: {
                action: 'mgr/resource/duplicate',
                register: 'mgr',
                topic: topic,
                id: id,
                context_key: _this.contexts[idx],
                last: idx === _this.contexts.length - 1,
                copy: values.copy,
                sync: values.sync,
            },
            listeners: {
                success: {
                    fn: function () {
                        idx = idx + 1;
                        if (idx < _this.contexts.length) {
                            _this.requestTranslation(idx, topic, id, values);
                        }
                    },
                    scope: this
                },
                failure: {
                    fn: function () {
                        idx = idx + 1;
                        if (idx < _this.contexts.length) {
                            _this.requestTranslation(idx, topic, id, values);
                        }
                    },
                    scope: this
                }
            }
        });
    },
    loadMask: function () {
        if (!this.overlayMask) {
            var domHandler = Ext.getBody().dom;
            this.overlayMask = new Ext.LoadMask(domHandler, {
                msg: _('babel.please_wait')
            });
        }
        this.overlayMask.show();
    },
    hideMask: function () {
        if (this.overlayMask) {
            this.overlayMask.hide();
        }
    },
    aboutWindow: function () {
        const msg = '&copy; 2010-2025 by Jakob Class<br><br>' +
            'Authors: <a href="https://github.com/mikrobi">Jakob Class</a>, <a href="https://github.com/goldsky">Rico Goldsky</a>, <a href="https://github.com/JoshuaLuckers">Joshua Luckers</a>, <a href="https://github.com/Jako">Thomas Jakobi</a><br><br>' +
            'Repository: <a href="https://github.com/mikrobi/babel">github.com/mikrobi/babel</a>';
        Ext.Msg.show({
            title: _('babel') + ' ' + Babel.config.version,
            msg: msg,
            buttons: Ext.Msg.OK,
            cls: 'babel_window',
            width: 358
        });
    }
});
Ext.reg('babel', babel);

var Babel = new babel();
