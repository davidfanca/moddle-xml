var _ = require('lodash');

var Writer = require('../../lib/Writer'),
    logger = require('moddle').util.Logger;

var Helper = require('./Helper'),
    log = Helper.log;


describe('Writer', function() {

  var createModel = Helper.createModelBuilder('test/fixtures/model/');

  var model = createModel(['properties']);
  var extendedModel = createModel(['properties', 'properties-extended']);

  function createWriter(model) {
    return new Writer({ preamble: false });
  }

  describe('api', function() {

  });

  describe('should export', function() {

    describe('base', function() {

      it('should write xml preamble', function() {
        // given
        var writer = new Writer({ preamble: true });
        var root = model.create('props:Root');

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<?xml version="1.0" encoding="UTF-8"?>\n<props:root xmlns:props="http://properties" />');
      });
    });

    describe('datatypes', function() {

      var datatypesModel = createModel(['datatype', 'datatype-external']);

      it('via xsi:type', function() {
        
        // given
        var writer = createWriter(datatypesModel);

        var root = datatypesModel.create('dt:Root');

        root.set('bounds', datatypesModel.create('dt:Rect', { y: 100 }));

        // when
        var xml = writer.toXML(root);
        
        // then
        expect(xml).toEqual('<dt:root xmlns:dt="http://datatypes"><dt:bounds y="100" /></dt:root>');
      });

      it('via xsi:type / in collection / other namespace)', function() {

        // given
        var writer = createWriter(datatypesModel);

        var root = datatypesModel.create('dt:Root');

        var otherBounds = root.get('otherBounds');

        otherBounds.push(datatypesModel.create('do:Rect', { x: 100 }));
        otherBounds.push(datatypesModel.create('do:Rect', { x: 200 }));

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual(
          '<dt:root xmlns:dt="http://datatypes" xmlns:do="http://datatypes2">' +
            '<dt:otherBounds x="100" />' +
            '<dt:otherBounds x="200" />' +
          '</dt:root>');
      });

    });

    describe('attributes', function() {

      it('with line breaks', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:BaseWithId', {
          id: 'FOO\nBAR'
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:baseWithId xmlns:props="http://properties" id="FOO&#10;BAR" />');
      });
      
    });

    describe('simple properties', function() {
      
      it('attribute', function() {
        
        // given
        var writer = createWriter(model);

        var attributes = model.create('props:Attributes', { integerValue: 1000 });

        // when
        var xml = writer.toXML(attributes);

        // then
        expect(xml).toEqual('<props:attributes xmlns:props="http://properties" integerValue="1000" />');
      });

      it('write integer property', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:SimpleBodyProperties', {
          intValue: 5
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:simpleBodyProperties xmlns:props="http://properties"><props:intValue>5</props:intValue></props:simpleBodyProperties>');
      });

      it('write boolean property', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:SimpleBodyProperties', {
          boolValue: false
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:simpleBodyProperties xmlns:props="http://properties"><props:boolValue>false</props:boolValue></props:simpleBodyProperties>');
      });

      it('write string isMany property', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:SimpleBodyProperties', {
          str: [ 'A', 'B', 'C' ]
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:simpleBodyProperties xmlns:props="http://properties"><props:str>A</props:str><props:str>B</props:str><props:str>C</props:str></props:simpleBodyProperties>');
      });

    });
  
    describe('embedded properties',  function() {

      it('single', function() {
        
        // given
        var writer = createWriter(model);

        var complexCount = model.create('props:ComplexCount', { id: 'ComplexCount_1' });
        var embedding = model.create('props:Embedding', { embeddedComplex: complexCount });

        // when
        var xml = writer.toXML(embedding);

        // then
        expect(xml).toEqual('<props:embedding xmlns:props="http://properties"><props:complexCount id="ComplexCount_1" /></props:embedding>');
      });

      it('collection', function() {
        
        // given
        var writer = createWriter(model);

        var root = model.create('props:Root');

        var attributes = model.create('props:Attributes', { id: 'Attributes_1' });
        var simpleBody = model.create('props:SimpleBody');
        var containedCollection = model.create('props:ContainedCollection');

        var any = root.get('any');
        
        any.push(attributes);
        any.push(simpleBody);
        any.push(containedCollection);

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:root xmlns:props="http://properties"><props:attributes id="Attributes_1" /><props:simpleBody /><props:containedCollection /></props:root>');
      });

      it('collection / different ns', function() {
        
        // given
        var writer = createWriter(extendedModel);

        var root = extendedModel.create('ext:Root');

        var attributes1 = extendedModel.create('props:Attributes', { id: 'Attributes_1' });
        var attributes2 = extendedModel.create('props:Attributes', { id: 'Attributes_2' });
        var extendedComplex = extendedModel.create('ext:ExtendedComplex', { numCount: 100 });

        var any = root.get('any');
        
        any.push(attributes1);
        any.push(attributes2);
        any.push(extendedComplex);

        var elements = root.get('elements');
        elements.push(extendedModel.create('ext:Base'));

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<ext:root xmlns:ext="http://extended" xmlns:props="http://properties"><props:attributes id="Attributes_1" /><props:attributes id="Attributes_2" /><ext:extendedComplex numCount="100" /><ext:base /></ext:root>');
      });

    });

    describe('body text', function() {

      it('write body text property', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:SimpleBody', {
          body: 'textContent'
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:simpleBody xmlns:props="http://properties">textContent</props:simpleBody>');
      });

      it('write body CDATA property', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:SimpleBody', {
          body: '<h2>HTML markup</h2>'
        });

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:simpleBody xmlns:props="http://properties"><![CDATA[<h2>HTML markup</h2>]]></props:simpleBody>');
      });

    });

    describe('alias', function() {

      it('lowerCase', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:Root');

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:root xmlns:props="http://properties" />');
      });

      it('none', function() {

        // given
        var noAliasModel = createModel(['noalias']);

        var writer = createWriter(noAliasModel);

        var root = noAliasModel.create('na:Root');

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<na:Root xmlns:na="http://noalias" />');
      });
    });

    describe('ns', function() {

      it('single package', function() {

        // given
        var writer = createWriter(model);

        var root = model.create('props:Root');

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:root xmlns:props="http://properties" />');
      });

      it('multiple packages', function() {

        // given
        var writer = createWriter(extendedModel);

        var root = extendedModel.create('props:Root');

        root.get('any').push(extendedModel.create('ext:ExtendedComplex'));

        // when
        var xml = writer.toXML(root);

        // then
        expect(xml).toEqual('<props:root xmlns:props="http://properties" xmlns:ext="http://extended"><ext:extendedComplex /></props:root>');
      });

    });

    describe('reference', function() {

      it('single', function() {
        
        // given
        var writer = createWriter(model);

        var complex = model.create('props:Complex', { id: 'Complex_1' });
        var referencingSingle = model.create('props:ReferencingSingle', { referencedComplex: complex });

        // when
        var xml = writer.toXML(referencingSingle);

        // then
        expect(xml).toEqual('<props:referencingSingle xmlns:props="http://properties" referencedComplex="Complex_1" />');
      });

      it('collection', function() {
        
        // given
        var writer = createWriter(model);

        var complexCount = model.create('props:ComplexCount', { id: 'ComplexCount_1' });
        var complexNesting = model.create('props:ComplexNesting', { id: 'ComplexNesting_1' });

        var referencingCollection = model.create('props:ReferencingCollection', { references: [ complexCount, complexNesting ] });

        // when
        var xml = writer.toXML(referencingCollection);

        // then
        expect(xml).toEqual(
          '<props:referencingCollection xmlns:props="http://properties">' +
            '<props:references>ComplexCount_1</props:references>' +
            '<props:references>ComplexNesting_1</props:references>' +
          '</props:referencingCollection>');
      });

    });
  });
});