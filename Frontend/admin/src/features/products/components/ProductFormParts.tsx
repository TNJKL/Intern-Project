import React from 'react';
import { Form, Input, InputNumber, Button, Row, Col, Upload } from 'antd';
import { UploadOutlined, LoadingOutlined, LinkOutlined, DeleteOutlined, PlusOutlined, OrderedListOutlined, PictureOutlined } from '@ant-design/icons';

// 1. Phần tải ảnh
export const ImageUploadSection: React.FC<{
  imageUrl: string;
  isUploading: boolean;
  uploadProps: any;
}> = ({ imageUrl, isUploading, uploadProps }) => (
  <div className="flex flex-col md:flex-row gap-8 items-start">
    <div className="w-32 h-32 shrink-0">
      <div className="w-full h-full rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group hover:border-[#d37533]/30 transition-all">
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center opacity-20">
            <UploadOutlined className="text-2xl" />
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <LoadingOutlined className="text-xl text-[#d37533]" />
          </div>
        )}
      </div>
    </div>
    
    <div className="flex-1 w-full space-y-4">
      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Hình ảnh sản phẩm</span>
      <Upload {...uploadProps} className="w-full">
        <Button block className="rounded-xl h-11 font-bold border-gray-200 hover:border-[#d37533] hover:text-[#d37533] flex items-center justify-center gap-2">
          <UploadOutlined /> Chọn ảnh từ máy tính
        </Button>
      </Upload>
      <Form.Item name="imageUrl" className="mb-0">
        <Input prefix={<LinkOutlined className="text-gray-300" />} placeholder="Hoặc dán link ảnh vào đây..." className="rounded-xl border-gray-200 h-11 text-xs" />
      </Form.Item>
    </div>
  </div>
);

// 2. Phần cấu hình Size & Giá
export const VariantSection: React.FC = () => (
  <div className="mt-12 pt-8 border-t border-gray-100">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
        <OrderedListOutlined className="text-gray-400" />
      </div>
      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Danh sách Size & Giá ban đầu</h4>
    </div>
    <Form.List name="variants" initialValue={[]}>
      {(fields, { add, remove }) => (
        <Row gutter={[16, 16]}>
          {fields.map(({ key, name, ...restField }) => (
            <Col span={24} key={key}>
              <div className="flex items-center gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 hover:bg-white hover:border-orange-200 transition-all group">
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 ml-1">Kích cỡ</span>
                  <Form.Item {...restField} name={[name, 'sizeLabel']} rules={[{ required: true, message: 'Size?' }]} className="mb-0">
                    <Input placeholder="Ví dụ: M, L, XL..." className="rounded-xl border-gray-100 font-black h-11 text-center" />
                  </Form.Item>
                </div>
                <div className="flex-[2]">
                  <span className="text-[9px] font-black uppercase text-gray-400 block mb-2 ml-1">Giá bán (VNĐ)</span>
                  <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Giá?' }]} className="mb-0">
                    <InputNumber
                      className="w-full rounded-xl border-gray-100 font-black h-11 flex items-center px-2"
                      placeholder="Nhập giá"
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value: any) => value!.replace(/\$\s?|(,*)/g, '')}
                      min={0}
                    />
                  </Form.Item>
                </div>
                {fields.length > 1 && (
                  <div className="pt-6">
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} className="rounded-xl hover:bg-red-50 h-11 w-11 flex items-center justify-center" />
                  </div>
                )}
              </div>
            </Col>
          ))}
          <Col span={24}>
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="rounded-2xl border-gray-200 text-gray-400 font-bold h-12 mt-2 hover:text-[#d37533] hover:border-[#d37533]">
              Thêm tùy chọn Size
            </Button>
          </Col>
        </Row>
      )}
    </Form.List>
  </div>
);

// 3. Phần tải nhiều hình ảnh phụ
export const AdditionalImagesSection: React.FC<{
  form: any;
  handleUploadAdditional: (options: any, fieldName: number) => Promise<void>;
}> = ({ form, handleUploadAdditional }) => {
  // Watch additionalImageUrls to render previews dynamically
  const additionalImageUrls = Form.useWatch('additionalImageUrls', form) || [];

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
          <PictureOutlined className="text-gray-400" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Hình ảnh phụ bổ sung (3-5 ảnh)</h4>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Các ảnh hiển thị dạng slideshow ở trang chi tiết khách hàng</p>
        </div>
      </div>
      <Form.List name="additionalImageUrls" initialValue={[]}>
        {(fields, { add, remove }) => (
          <Row gutter={[16, 16]}>
            {fields.map(({ key, name, ...restField }) => {
              const currentUrl = additionalImageUrls[name] || '';
              return (
                <Col span={24} key={key}>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 hover:bg-white hover:border-orange-200 transition-all">
                    {/* Thumbnail Preview */}
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center relative">
                      {currentUrl ? (
                        <img src={currentUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PictureOutlined className="text-lg text-gray-300" />
                      )}
                    </div>
                    {/* Input URL field and upload button */}
                    <div className="flex-1 w-full flex flex-col md:flex-row gap-2">
                      <Form.Item
                        {...restField}
                        name={name}
                        className="mb-0 flex-1"
                      >
                        <Input
                          prefix={<LinkOutlined className="text-gray-300" />}
                          placeholder="Dán link ảnh phụ..."
                          className="rounded-xl border-gray-200 h-11 text-xs"
                        />
                      </Form.Item>
                      <Upload
                        customRequest={(options) => handleUploadAdditional(options, name)}
                        showUploadList={false}
                      >
                        <Button className="rounded-xl h-11 border-gray-200 hover:border-[#d37533] hover:text-[#d37533] text-xs font-bold px-4">
                          Tải ảnh lên
                        </Button>
                      </Upload>
                    </div>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      className="rounded-xl hover:bg-red-50 h-11 w-11 flex items-center justify-center self-end sm:self-center"
                    />
                  </div>
                </Col>
              );
            })}
            {fields.length < 5 && (
              <Col span={24}>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  className="rounded-2xl border-gray-200 text-gray-400 font-bold h-12 hover:text-[#d37533] hover:border-[#d37533]"
                >
                  Thêm ảnh phụ
                </Button>
              </Col>
            )}
          </Row>
        )}
      </Form.List>
    </div>
  );
};
