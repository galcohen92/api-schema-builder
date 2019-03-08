'use strict';

let chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    chaiSinon = require('chai-sinon'),
    request = require('supertest'),
    schemaValidatorGenerator = require('../../index'),
    path = require('path'),
    InputValidationError = require('../inputValidationError');

chai.use(chaiSinon);
describe('oas3 check', function () {
    let schema;
    before(async () => {
        const swaggerPath = path.join(__dirname, 'pets.yaml');
        schema = await schemaValidatorGenerator.getSchema(swaggerPath, {
            formats: [
                { name: 'double', pattern: /\d+(\.\d+)?/ },
                { name: 'int64', pattern: /^\d{1,19}$/ },
                { name: 'int32', pattern: /^\d{1,10}$/ }
            ],
            beautifyErrors: true,
            firstError: false
        });
    });
    describe('check headers', function () {
        let schemaEndpoint;
        before(async () => {
            schemaEndpoint = schema['/pet']['post'];
        });
        it('valid headers', async function () {
            // parameters match
            let isParametersMatch = schemaEndpoint.parameters({ query: {},
                headers: { 'public-key': '1.0'
                },
                path: {},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.equal(null);
            expect(isParametersMatch).to.be.true;
        });
        it('missing required header', async function () {
            // parameters match
            let isParametersMatch = schemaEndpoint.parameters({ query: {},
                headers: {'host': 'test'},
                path: {},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.eql([{
                'dataPath': '.headers',
                'keyword': 'required',
                'message': "should have required property 'public-key'",
                'params': {
                    'missingProperty': 'public-key'
                },
                'schemaPath': '#/properties/headers/required'
            }]);
            expect(isParametersMatch).to.be.false;
        });
        it('invalid type for headers', async function () {
            // parameters match
            let isParametersMatch = schemaEndpoint.parameters({ query: {},
                headers: 3,
                path: {},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.eql([{
                'dataPath': '.headers',
                'keyword': 'type',
                'message': 'should be object',
                'params': {
                    'type': 'object'
                },
                'schemaPath': '#/properties/headers/type'
            }]);
            expect(isParametersMatch).to.be.false;
        });
    });

    describe('check queries', function () {
        let schemaEndpoint;
        before(async () => {
            schemaEndpoint = schema['/pets-query']['get'];
        });
        it('valid query', async function () {
            let isParametersMatch = schemaEndpoint.parameters({
                query: {page: '1'},
                headers: {},
                path: {},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.equal(null);
            expect(isParametersMatch).to.be.true;
        });
        it('missing required query', async function () {
            let isParametersMatch = schemaEndpoint.parameters({
                query: {wrong_query: 'nothing'},
                headers: {},
                path: {},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.eql([
                {
                    'dataPath': '.query',
                    'keyword': 'required',
                    'message': "should have required property 'page'",
                    'params': {
                        'missingProperty': 'page'
                    },
                    'schemaPath': '#/properties/query/required'
                },
                {
                    'dataPath': '.query',
                    'keyword': 'additionalProperties',
                    'message': 'should NOT have additional properties',
                    'params': {
                        'additionalProperty': 'wrong_query'
                    },
                    'schemaPath': '#/properties/query/additionalProperties'
                }
            ]);
            expect(isParametersMatch).to.be.false;
        });
    });

    describe('check path', function () {
        let schemaEndpoint;
        before(async () => {
            schemaEndpoint = schema['/pets-path/:name']['get'];
        });
        it('valid headers', async function () {
            // parameters match
            let isParametersMatch = schemaEndpoint.parameters({ query: {},
                headers: { 'public-key': '1.0'
                },
                path: { name: 'kitty'},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.equal(null);
            expect(isParametersMatch).to.be.true;
        });
        it('missing required header', async function () {
            // parameters match
            let isParametersMatch = schemaEndpoint.parameters({ query: {},
                headers: {'host': 'test'},
                path: { namee: 'kitty'},
                files: undefined});
            expect(schemaEndpoint.parameters.errors).to.be.eql([
                {
                    'dataPath': '.path',
                    'keyword': 'required',
                    'message': "should have required property 'name'",
                    'params': {
                        'missingProperty': 'name'
                    },
                    'schemaPath': '#/properties/path/required'
                },
                {
                    'dataPath': '.path',
                    'keyword': 'additionalProperties',
                    'message': 'should NOT have additional properties',
                    'params': {
                        'additionalProperty': 'namee'
                    },
                    'schemaPath': '#/properties/path/additionalProperties'
                }
            ]);
            expect(isParametersMatch).to.be.false;
        });
    });

    // no tests were written
    describe.skip('check file', function () {});

    describe('check body', function () {
        let schemaEndpoint;
        before(async () => {
            schemaEndpoint = schema['/dog']['post'];
        });

        describe('simple body', function () {
            it('valid simple body', async function () {
                // body match
                let isBodysMatch = schemaEndpoint.body.validate({
                    'bark': 'hav hav'
                });
                expect(schemaEndpoint.body.errors).to.be.equal(null);
                expect(isBodysMatch).to.be.true;
            });
            it('missing required field in simple body', async function () {
                // body match
                let isBodysMatch = schemaEndpoint.body.validate({
                    'fur': 'hav hav'
                });

                expect(schemaEndpoint.body.errors).to.be.eql([
                    {
                        'dataPath': '',
                        'keyword': 'required',
                        'message': "should have required property 'bark'",
                        'params': {
                            'missingProperty': 'bark'
                        },
                        'schemaPath': '#/required'
                    }
                ]);
                expect(isBodysMatch).to.be.false;
            });
            it('invalid field type in simple body', async function () {
                // body match
                let isBodysMatch = schemaEndpoint.body.validate({
                    'bark': 111
                });

                expect(schemaEndpoint.body.errors).to.be.eql([
                    {
                        'dataPath': '.bark',
                        'keyword': 'type',
                        'message': 'should be string',
                        'params': {
                            'type': 'string'
                        },
                        'schemaPath': '#/properties/bark/type'
                    }
                ]);
                expect(isBodysMatch).to.be.false;
            });
        });

        describe('body with discriminator', function () {
            describe('discriminator-pet', function () {
                let schemaEndpoint;
                before(async () => {
                    schemaEndpoint = schema['/pet-discriminator']['post'];
                });
                it('missing discriminator field', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        'bark': 'hav hav'
                    });

                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: true });
                    expect(error.errors).to.be.equal('body/type should be equal to one of the allowed values [dog_object,cat_object]');

                    // expect(schemaEndpoint.body.errors).to.be.equal('["Error: should be equal to one of the allowed values"]');
                    expect(isBodysMatch).to.be.false;
                });
                it('when discriminator type is dog and missing field', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        'type': 'dog_object'
                    });
                    expect(schemaEndpoint.body.errors).to.be.eql([
                        {
                            'dataPath': '',
                            'keyword': 'required',
                            'message': "should have required property 'bark'",
                            'params': {
                                'missingProperty': 'bark'
                            },
                            'schemaPath': '#/required'
                        }
                    ]);
                    expect(isBodysMatch).to.be.false;
                });
                it('valid complex body', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        bark: 'hav hav',
                        type: 'dog_object'
                    });
                    expect(schemaEndpoint.body.errors).to.be.equal(null);
                    expect(isBodysMatch).to.be.true;
                });
            });
            describe('discriminator-multiple pet', function () {
                before(async () => {
                    schemaEndpoint = schema['/pet-discriminator-multiple']['post'];
                });
                it('missing discriminator field', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        'fur': 'hav hav'
                    });

                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: true });
                    expect(error.errors).to.be.equal('body/type should be equal to one of the allowed values [dog_multiple,cat_object]');

                    // expect(schemaEndpoint.body.errors).to.be.equal('["Error: should be equal to one of the allowed values"]');
                    expect(isBodysMatch).to.be.false;
                });
                it('missing discriminator field on the on inside discriminator', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        bark: 'hav hav',
                        type: 'dog_multiple'
                    });
                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: true });
                    expect(error.errors).to.be.equal('body/model should be equal to one of the allowed values [small_dog,big_dog]');
                    expect(isBodysMatch).to.be.false;
                });
                it('when discriminator type is dog_multiple and model small_dog and missing root field name and specific plane field', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        type: 'dog_multiple',
                        model: 'small_dog'
                    });
                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: false });
                    expect(error.errors).to.be.eql([
                        "body should have required property 'max_length'",
                        "body should have required property 'name'",
                        "body should have required property 'dog_age'"
                    ]);
                    expect(isBodysMatch).to.be.false;
                });
                it('when valid discriminator type is dog_multiple and model small_dog', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        name: 'sesna',
                        max_length: 'max_length',
                        dog_age: '3',
                        type: 'dog_multiple',
                        model: 'small_dog'
                    });
                    expect(schemaEndpoint.body.errors).to.be.equal(null);
                    expect(isBodysMatch).to.be.true;
                });
            });
            describe('discriminator-mapping pet', function () {
                before(async () => {
                    schemaEndpoint = schema['/pet-discriminator-mapping']['post'];
                });
                it('missing discriminator field on the root', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        fur: '6'
                    });
                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: true });
                    expect(error.errors).to.be.equal('body/type should be equal to one of the allowed values [mapped_dog,mapped_cat]');
                    expect(isBodysMatch).to.be.false;
                });
                it('when discriminator type is mapped_dog and model small_dog and missing root field name and specific dog field', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        type: 'mapped_dog',
                        model: 'small_dog'
                    });
                    const error = new InputValidationError(schemaEndpoint.body.errors, '/pet-discriminator', 'post',
                        { beautifyErrors: true,
                            firstError: true });
                    expect(error.errors).to.be.equal('body should have required property \'max_length\'');
                    expect(isBodysMatch).to.be.false;
                });
                it('when valid discriminator type is mapped_dog and model small_dog', async function () {
                    // body match
                    let isBodysMatch = schemaEndpoint.body.validate({
                        name: 'sesna',
                        max_length: 'max_length',
                        dog_age: '200',
                        type: 'mapped_dog',
                        model: 'small_dog'
                    });

                    expect(schemaEndpoint.body.errors).to.be.equal(null);
                    expect(isBodysMatch).to.be.true;
                });
            });
        });
    });
});
